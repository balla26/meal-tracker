import { useMemo, useState } from 'react'
import { Header } from '../components/Header'
import { StatusPill } from '../components/StatusPill'
import { useData } from '../context/DataContext'
import { useSession } from '../context/SessionContext'
import type { MealStatus, MealType } from '../types'
import { formatDateLabel, formatTime } from '../lib/datetime'
import { MEAL_LABELS, STATUS_LABELS } from '../lib/reminders'

const MEAL_FILTERS: Array<{ value: MealType | 'all'; label: string }> = [
  { value: 'all', label: 'All meals' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
]

const STATUS_FILTERS: Array<{ value: MealStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'ate', label: STATUS_LABELS.ate },
  { value: 'didnt_eat', label: STATUS_LABELS.didnt_eat },
  { value: 'will_eat_later', label: STATUS_LABELS.will_eat_later },
  { value: 'missed', label: STATUS_LABELS.missed },
]

export function History() {
  const { db, users } = useData()
  const { currentProfile } = useSession()
  const isEngineer = currentProfile?.role === 'engineer'
  const visibleUsers = isEngineer ? users.filter((u) => u.shareWithEngineer) : users.filter((u) => u.id === currentProfile?.id)

  const [userId, setUserId] = useState(visibleUsers[0]?.id ?? '')
  const [mealFilter, setMealFilter] = useState<MealType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<MealStatus | 'all'>('all')

  const activeUserId = userId || visibleUsers[0]?.id

  const grouped = useMemo(() => {
    const filtered = db.meals
      .filter((m) => m.userId === activeUserId)
      .filter((m) => m.status !== 'not_updated')
      .filter((m) => mealFilter === 'all' || m.mealType === mealFilter)
      .filter((m) => statusFilter === 'all' || m.status === statusFilter)
      .sort((a, b) => (a.date === b.date ? (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '') : b.date.localeCompare(a.date)))

    const byDate = new Map<string, typeof filtered>()
    for (const meal of filtered) {
      const list = byDate.get(meal.date) ?? []
      list.push(meal)
      byDate.set(meal.date, list)
    }
    return Array.from(byDate.entries())
  }, [db.meals, activeUserId, mealFilter, statusFilter])

  return (
    <div>
      <Header title="History" subtitle="Daily, weekly, and monthly meal records" />

      <div className="space-y-3 px-4">
        {isEngineer && visibleUsers.length > 1 && (
          <select
            value={activeUserId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            {visibleUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1">
          <select
            value={mealFilter}
            onChange={(e) => setMealFilter(e.target.value as MealType | 'all')}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {MEAL_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as MealStatus | 'all')}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {!activeUserId && (
          <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400 dark:border-slate-800">
            No shared meal history to show.
          </p>
        )}

        {grouped.length === 0 && activeUserId && (
          <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400 dark:border-slate-800">
            No records match these filters yet.
          </p>
        )}

        <div className="space-y-4">
          {grouped.map(([date, meals]) => (
            <div key={date}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {formatDateLabel(date)}
              </p>
              <div className="space-y-2">
                {meals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{MEAL_LABELS[meal.mealType]}</p>
                      <p className="text-xs text-slate-400">{formatTime(meal.updatedAt)}</p>
                      {meal.note && <p className="mt-0.5 truncate text-xs italic text-slate-400">"{meal.note}"</p>}
                    </div>
                    <StatusPill status={meal.status} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
