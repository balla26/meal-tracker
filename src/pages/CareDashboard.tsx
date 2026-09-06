import { useMemo, useState } from 'react'
import { BellPlus, TrendingUp, Clock3, AlertCircle } from 'lucide-react'
import { Header } from '../components/Header'
import { StatusPill } from '../components/StatusPill'
import { useData } from '../context/DataContext'
import { MEAL_LABELS } from '../lib/reminders'
import { daysAgoKey, formatTime, todayKey } from '../lib/datetime'
import type { CareTone, MealType } from '../types'

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']
const TONE_OPTIONS: Array<{ value: CareTone; label: string }> = [
  { value: 'caring', label: 'Caring' },
  { value: 'funny', label: 'Funny' },
  { value: 'cute', label: 'Cute' },
  { value: 'professional', label: 'Professional' },
  { value: 'strict', label: 'Strict' },
]

export function CareDashboard() {
  const { db, users, sendEngineerReminder, markAlertRead } = useData()
  const shared = users.filter((u) => u.shareWithEngineer)
  const [selectedId, setSelectedId] = useState(shared[0]?.id ?? '')
  const [tone, setTone] = useState<CareTone>(db.settings.reminders.tone)
  const activeId = selectedId || shared[0]?.id

  const today = todayKey()
  const todayMeals = useMemo(
    () =>
      db.meals
        .filter((m) => m.userId === activeId && m.date === today)
        .sort((a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType)),
    [db.meals, activeId, today],
  )

  const weeklyStats = useMemo(() => {
    const since = daysAgoKey(6)
    const recent = db.meals.filter((m) => m.userId === activeId && m.date >= since && m.status !== 'not_updated')
    const completed = recent.filter((m) => m.status !== 'missed').length
    const missed = recent.filter((m) => m.status === 'missed').length
    const delaysByMeal = new Map<MealType, number>()
    for (const m of recent) {
      if (!m.reminders.gentleSentAt) continue
      delaysByMeal.set(m.mealType, (delaysByMeal.get(m.mealType) ?? 0) + 1)
    }
    let mostDelayed: MealType | null = null
    let max = 0
    for (const [type, count] of delaysByMeal) {
      if (count > max) {
        max = count
        mostDelayed = type
      }
    }
    return { completed, missed, total: recent.length, mostDelayed }
  }, [db.meals, activeId])

  const alerts = useMemo(
    () => db.alerts.filter((a) => a.userId === activeId).slice(0, 20),
    [db.alerts, activeId],
  )

  if (shared.length === 0) {
    return (
      <div>
        <Header title="Care Dashboard" subtitle="No one has shared their meal data with you yet." />
      </div>
    )
  }

  return (
    <div>
      <Header title="Care Dashboard" subtitle="A caring glance, not a clinical chart." />

      <div className="space-y-5 px-4">
        {shared.length > 1 && (
          <select
            value={activeId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {shared.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        )}

        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">Today at a glance</h2>
          <div className="space-y-2">
            {todayMeals.map((meal) => (
              <div
                key={meal.id}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{MEAL_LABELS[meal.mealType]}</p>
                  <p className="text-xs text-slate-400">
                    {meal.updatedAt ? `Updated ${formatTime(meal.updatedAt)}` : 'Not updated yet'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={meal.status} />
                  {meal.status === 'not_updated' || meal.status === 'missed' ? (
                    <button
                      onClick={() => sendEngineerReminder(meal.userId, meal.mealType, tone)}
                      className="flex items-center gap-1 rounded-lg bg-honey-500 px-2 py-1.5 text-xs font-semibold text-white hover:bg-honey-600"
                    >
                      <BellPlus size={14} /> Remind
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <label htmlFor="tone" className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Reminder tone
            </label>
            <select
              id="tone"
              value={tone}
              onChange={(e) => setTone(e.target.value as CareTone)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {TONE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section>
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <TrendingUp size={16} /> This week
          </h2>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{weeklyStats.completed}</p>
              <p className="text-xs text-slate-400">meals completed</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{weeklyStats.missed}</p>
              <p className="text-xs text-slate-400">meals missed</p>
            </div>
          </div>
          {weeklyStats.mostDelayed && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Clock3 size={13} /> {MEAL_LABELS[weeklyStats.mostDelayed]} is the most frequently delayed meal this week.
            </p>
          )}
        </section>

        <section>
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <AlertCircle size={16} /> Alert history
          </h2>
          {alerts.length === 0 && <p className="text-sm text-slate-400">No alerts yet — all quiet.</p>}
          <div className="space-y-2">
            {alerts.map((alert) => (
              <button
                key={alert.id}
                onClick={() => markAlertRead(alert.id)}
                className={`w-full rounded-xl border p-3 text-left text-sm transition-colors ${
                  alert.read
                    ? 'border-slate-200 bg-white text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400'
                    : 'border-honey-300 bg-honey-50 text-slate-800 dark:border-honey-800 dark:bg-honey-950/30 dark:text-slate-100'
                }`}
              >
                <p className="font-medium">{alert.message}</p>
                <p className="mt-0.5 text-xs text-slate-400">{formatTime(alert.createdAt)}</p>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
