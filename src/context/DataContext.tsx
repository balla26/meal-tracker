import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { AlertEntry, AppSettings, CareTone, HoneyDatabase, MealEntry, MealStatus, MealType, Profile, ReminderSettings } from '../types'
import {
  bootstrapDatabase,
  downloadBackup,
  importBackupFile as importBackupFileRaw,
  loadFromServer,
  saveToServer,
  writeCache,
} from '../lib/db'
import { ensureTodayEntries } from '../lib/rollover'
import { evaluateReminders, gentleReminderText, followUpReminderText, engineerAlertText } from '../lib/reminders'
import { sendBrowserNotification } from '../lib/notifications'
import { makeId } from '../lib/id'
import { defaultReminderSettings } from '../lib/defaults'
import { useToast } from './ToastContext'

interface DataContextValue {
  db: HoneyDatabase
  profiles: Profile[]
  users: Profile[]
  engineers: Profile[]

  // Meals
  updateMealStatus: (mealId: string, status: MealStatus, note?: string) => void
  snoozeMeal: (mealId: string, minutes: number) => void
  sendEngineerReminder: (userId: string, mealType: MealType, tone: CareTone) => void
  markAlertRead: (alertId: string) => void

  // Profiles
  createProfile: (role: Profile['role'], name: string, email: string) => Profile
  updateProfile: (id: string, updates: Partial<Profile>) => void

  // Settings
  updateTheme: (theme: AppSettings['theme']) => void
  updateReminderSettings: (updates: Partial<ReminderSettings>) => void

  // Data lifecycle
  eraseAllData: () => void

  // Project-local file persistence (see vite.config.ts's local-db middleware)
  serverConnected: boolean
  exportBackup: () => void
  importBackup: (file: File) => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast()
  const [db, setDb] = useState<HoneyDatabase>(() => ensureTodayEntries(bootstrapDatabase()))
  const [serverConnected, setServerConnected] = useState(false)
  const dbRef = useRef(db)
  const writeTimer = useRef<number | null>(null)
  const hasLoadedFromServer = useRef(false)
  dbRef.current = db

  // Load the project-local data file (data/honey-data.json) on first mount, if reachable.
  useEffect(() => {
    let cancelled = false
    loadFromServer().then(({ reachable, db: serverDb }) => {
      if (cancelled) return
      setServerConnected(reachable)
      hasLoadedFromServer.current = true
      if (serverDb) setDb(ensureTodayEntries(serverDb))
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Persist on every change: localStorage synchronously, the project data file debounced.
  useEffect(() => {
    writeCache(db)
    if (!hasLoadedFromServer.current) return // avoid overwriting the file before we've read it
    if (writeTimer.current) window.clearTimeout(writeTimer.current)
    writeTimer.current = window.setTimeout(() => {
      saveToServer(db)
        .then(() => setServerConnected(true))
        .catch(() => setServerConnected(false))
    }, 500)
  }, [db])

  // Reminder engine: re-evaluate every 30s against real wall-clock time.
  const hasTickedRef = useRef(false)
  useEffect(() => {
    const tick = () => {
      const withToday = ensureTodayEntries(dbRef.current)
      const result = evaluateReminders(withToday)
      if (result.db !== withToday || withToday !== dbRef.current) {
        setDb(result.db)
      }
      const tone = result.db.settings.reminders.tone
      for (const meal of result.gentleReminders) {
        const text = gentleReminderText(meal.mealType, tone)
        showToast(text, 'info')
        sendBrowserNotification('Honey', text)
      }
      for (const meal of result.followUpReminders) {
        const text = followUpReminderText(meal.mealType, tone)
        showToast(text, 'warning')
        sendBrowserNotification('Honey', text)
      }
      for (const alert of result.newAlerts) {
        showToast(`Care alert: ${engineerAlertText(alert.mealType)}`, 'error')
      }
    }
    if (!hasTickedRef.current) {
      hasTickedRef.current = true
      tick()
    }
    const interval = window.setInterval(tick, 30_000)
    return () => window.clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateMealStatus = useCallback((mealId: string, status: MealStatus, note?: string) => {
    setDb((prev) => ({
      ...prev,
      meals: prev.meals.map((m) =>
        m.id === mealId
          ? { ...m, status, note: note ?? m.note, updatedAt: new Date().toISOString(), snoozeUntil: null }
          : m,
      ),
    }))
  }, [])

  const snoozeMeal = useCallback((mealId: string, minutes: number) => {
    const until = new Date(Date.now() + minutes * 60_000).toISOString()
    setDb((prev) => ({
      ...prev,
      meals: prev.meals.map((m) => (m.id === mealId ? { ...m, snoozeUntil: until } : m)),
    }))
    showToast(`Snoozed for ${minutes} minutes.`, 'info')
  }, [showToast])

  const sendEngineerReminder = useCallback(
    (userId: string, mealType: MealType, tone: CareTone) => {
      const now = new Date()
      const today = now.toISOString().slice(0, 10)
      setDb((prev) => {
        const existing = prev.meals.find(
          (m) => m.userId === userId && m.mealType === mealType && m.date === today,
        )
        const alert: AlertEntry = {
          id: makeId('alert'),
          userId,
          mealId: existing?.id ?? '',
          mealType,
          trigger: 'engineer_reminder_sent',
          message: gentleReminderText(mealType, tone),
          createdAt: now.toISOString(),
          read: true,
        }
        const meals = existing
          ? prev.meals.map((m) =>
              m.id === existing.id ? { ...m, reminders: { ...m.reminders, gentleSentAt: now.toISOString() } } : m,
            )
          : prev.meals
        return { ...prev, meals, alerts: [alert, ...prev.alerts] }
      })
      showToast('Reminder sent.', 'success')
    },
    [showToast],
  )

  const markAlertRead = useCallback((alertId: string) => {
    setDb((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) => (a.id === alertId ? { ...a, read: true } : a)),
    }))
  }, [])

  const createProfile = useCallback((role: Profile['role'], name: string, email: string): Profile => {
    const profile: Profile = {
      id: makeId('profile'),
      role,
      name,
      email,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      createdAt: new Date().toISOString(),
      shareWithEngineer: true,
      reminderSettings: defaultReminderSettings(),
    }
    setDb((prev) => ({ ...prev, profiles: [...prev.profiles, profile] }))
    return profile
  }, [])

  const updateProfile = useCallback((id: string, updates: Partial<Profile>) => {
    setDb((prev) => ({
      ...prev,
      profiles: prev.profiles.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }))
  }, [])

  const updateTheme = useCallback((theme: AppSettings['theme']) => {
    setDb((prev) => ({ ...prev, settings: { ...prev.settings, theme } }))
  }, [])

  const updateReminderSettings = useCallback((updates: Partial<ReminderSettings>) => {
    setDb((prev) => ({
      ...prev,
      settings: { ...prev.settings, reminders: { ...prev.settings.reminders, ...updates } },
    }))
  }, [])

  const eraseAllData = useCallback(() => {
    setDb((prev) => ({ ...prev, meals: [], alerts: [] }))
    showToast('Your meal history and alerts have been deleted.', 'success')
  }, [showToast])

  const exportBackup = useCallback(() => {
    downloadBackup(dbRef.current)
  }, [])

  const importBackup = useCallback(
    async (file: File) => {
      const loaded = await importBackupFileRaw(file)
      setDb(ensureTodayEntries(loaded))
      showToast('Backup imported.', 'success')
    },
    [showToast],
  )

  const profiles = db.profiles
  const users = useMemo(() => profiles.filter((p) => p.role === 'user'), [profiles])
  const engineers = useMemo(() => profiles.filter((p) => p.role === 'engineer'), [profiles])

  const value: DataContextValue = {
    db,
    profiles,
    users,
    engineers,
    updateMealStatus,
    snoozeMeal,
    sendEngineerReminder,
    markAlertRead,
    createProfile,
    updateProfile,
    updateTheme,
    updateReminderSettings,
    eraseAllData,
    serverConnected,
    exportBackup,
    importBackup,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within a DataProvider')
  return ctx
}

export type { MealEntry }
