import type { AppSettings, HoneyDatabase, Profile, ReminderSettings } from '../types'
import { defaultReminderSettings } from './defaults'

const CACHE_KEY = 'honey-db-cache-v1'
const SERVER_KEY = 'honey-db-server-v1'

function defaultAppSettings(): AppSettings {
  return {
    theme: 'system',
    reminders: defaultReminderSettings(),
  }
}

function defaultDatabase(): HoneyDatabase {
  return {
    profiles: [],
    meals: [],
    alerts: [],
    settings: defaultAppSettings(),
  }
}

function normalizeTheme(theme: unknown): AppSettings['theme'] {
  return theme === 'light' || theme === 'dark' || theme === 'system' ? theme : 'system'
}

function normalizeReminderSettings(reminders: unknown): ReminderSettings {
  const base = defaultReminderSettings()
  if (!reminders || typeof reminders !== 'object') return base

  const candidate = reminders as Partial<ReminderSettings>

  return {
    breakfast: { ...base.breakfast, ...(candidate.breakfast ?? {}) },
    lunch: { ...base.lunch, ...(candidate.lunch ?? {}) },
    dinner: { ...base.dinner, ...(candidate.dinner ?? {}) },
    snack: { ...base.snack, ...(candidate.snack ?? {}) },
    quietHours: { ...base.quietHours, ...(candidate.quietHours ?? {}) },
    missedMealAlertsEnabled:
      typeof candidate.missedMealAlertsEnabled === 'boolean'
        ? candidate.missedMealAlertsEnabled
        : base.missedMealAlertsEnabled,
    tone: candidate.tone ?? base.tone,
  }
}

function normalizeSettings(settings: unknown): AppSettings {
  const base = defaultAppSettings()
  if (!settings || typeof settings !== 'object') return base
  const candidate = settings as Partial<AppSettings>

  return {
    theme: normalizeTheme(candidate.theme),
    reminders: normalizeReminderSettings(candidate.reminders),
  }
}

function normalizeProfile(profile: unknown): Profile | null {
  if (!profile || typeof profile !== 'object') return null
  const candidate = profile as Record<string, unknown>
  if (typeof candidate.id !== 'string') return null
  if (candidate.role !== 'user' && candidate.role !== 'engineer') return null

  return {
    id: candidate.id,
    role: candidate.role,
    name: typeof candidate.name === 'string' ? candidate.name : '',
    email: typeof candidate.email === 'string' ? candidate.email : '',
    timezone: typeof candidate.timezone === 'string' ? candidate.timezone : Intl.DateTimeFormat().resolvedOptions().timeZone,
    createdAt: typeof candidate.createdAt === 'string' ? candidate.createdAt : new Date().toISOString(),
    shareWithEngineer: typeof candidate.shareWithEngineer === 'boolean' ? candidate.shareWithEngineer : true,
    reminderSettings: normalizeReminderSettings(candidate.reminderSettings),
  }
}

function parseDb(raw: string | null): HoneyDatabase | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<HoneyDatabase>
    return {
      profiles: Array.isArray(parsed.profiles)
        ? parsed.profiles.map(normalizeProfile).filter((profile): profile is NonNullable<ReturnType<typeof normalizeProfile>> => profile !== null)
        : [],
      meals: Array.isArray(parsed.meals) ? parsed.meals : [],
      alerts: Array.isArray(parsed.alerts) ? parsed.alerts : [],
      settings: normalizeSettings(parsed.settings),
    }
  } catch {
    return null
  }
}

function writeLocal(key: string, db: HoneyDatabase): void {
  localStorage.setItem(key, JSON.stringify(db))
}

export function bootstrapDatabase(): HoneyDatabase {
  return parseDb(localStorage.getItem(CACHE_KEY)) ?? defaultDatabase()
}

export function writeCache(db: HoneyDatabase): void {
  writeLocal(CACHE_KEY, db)
}

export async function loadFromServer(): Promise<{ reachable: boolean; db: HoneyDatabase | null }> {
  return {
    reachable: true,
    db: parseDb(localStorage.getItem(SERVER_KEY)),
  }
}

export async function saveToServer(db: HoneyDatabase): Promise<void> {
  writeLocal(SERVER_KEY, db)
}

export function downloadBackup(db: HoneyDatabase): void {
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `honey-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importBackupFile(file: File): Promise<HoneyDatabase> {
  const text = await file.text()
  try {
    const parsed = JSON.parse(text) as Partial<HoneyDatabase>
    return {
      profiles: Array.isArray(parsed.profiles)
        ? parsed.profiles.map(normalizeProfile).filter((profile): profile is NonNullable<ReturnType<typeof normalizeProfile>> => profile !== null)
        : [],
      meals: Array.isArray(parsed.meals) ? parsed.meals : [],
      alerts: Array.isArray(parsed.alerts) ? parsed.alerts : [],
      settings: normalizeSettings(parsed.settings),
    }
  } catch {
    throw new Error('Invalid backup file. Please select a valid Honey JSON backup.')
  }
}
