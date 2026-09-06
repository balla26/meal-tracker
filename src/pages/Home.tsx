import { useMemo, useState } from 'react'
import { Sparkles, BellRing } from 'lucide-react'
import { Header } from '../components/Header'
import { MealCard } from '../components/MealCard'
import { UpdateMealSheet } from '../components/UpdateMealSheet'
import { useData } from '../context/DataContext'
import { useSession } from '../context/SessionContext'
import type { MealEntry, MealType } from '../types'
import { formatClock, formatTime, greeting, parseTimeToMinutes, minutesSinceMidnight, todayKey } from '../lib/datetime'
import { celebrationText, MEAL_LABELS } from '../lib/reminders'

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

export function Home() {
  const { db } = useData()
  const { currentProfile } = useSession()
  const [activeMeal, setActiveMeal] = useState<MealEntry | null>(null)

  const todayMeals = useMemo(() => {
    if (!currentProfile) return []
    const today = todayKey()
    return db.meals
      .filter((m) => m.userId === currentProfile.id && m.date === today)
      .sort((a, b) => MEAL_ORDER.indexOf(a.mealType) - MEAL_ORDER.indexOf(b.mealType))
  }, [db.meals, currentProfile])

  const updatedCount = todayMeals.filter((m) => m.status === 'ate' || m.status === 'didnt_eat' || m.status === 'will_eat_later').length
  const allDone = todayMeals.length > 0 && updatedCount === todayMeals.length
  const latestUpdate = todayMeals.reduce<string | null>((latest, m) => {
    if (!m.updatedAt) return latest
    if (!latest || m.updatedAt > latest) return m.updatedAt
    return latest
  }, null)

  const nextReminder = useMemo(() => {
    const nowMinutes = minutesSinceMidnight()
    let best: { mealType: MealType; time: string } | null = null
    for (const meal of todayMeals) {
      if (meal.status !== 'not_updated') continue
      const config = db.settings.reminders[meal.mealType]
      if (!config.enabled) continue
      const windowMinutes = parseTimeToMinutes(config.time)
      if (windowMinutes < nowMinutes) continue
      if (!best || windowMinutes < parseTimeToMinutes(best.time)) best = { mealType: meal.mealType, time: config.time }
    }
    return best
  }, [todayMeals, db.settings.reminders])

  return (
    <div>
      <Header title={`${greeting()}, ${currentProfile?.name?.split(' ')[0] ?? ''}`} subtitle={new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} />

      <div className="space-y-4 px-4">
        <div className="rounded-2xl bg-gradient-to-br from-honey-500 to-honey-600 p-4 text-white shadow-lg shadow-honey-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-honey-100">Today's progress</p>
              <p className="text-2xl font-bold">
                {updatedCount} of {todayMeals.length} meals updated
              </p>
            </div>
            {allDone ? <Sparkles size={28} /> : <BellRing size={28} className="opacity-80" />}
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: todayMeals.length ? `${(updatedCount / todayMeals.length) * 100}%` : '0%' }}
            />
          </div>
          <p className="mt-3 text-sm text-honey-50">
            {allDone
              ? celebrationText()
              : nextReminder
                ? `Next check-in: ${MEAL_LABELS[nextReminder.mealType]} around ${formatClock(nextReminder.time)}`
                : latestUpdate
                  ? `Last update at ${formatTime(latestUpdate)}`
                  : 'No reminders scheduled for today.'}
          </p>
        </div>

        <div className="space-y-3">
          {todayMeals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              reminderTime={
                db.settings.reminders[meal.mealType].enabled ? formatClock(db.settings.reminders[meal.mealType].time) : undefined
              }
              onOpenDetails={() => setActiveMeal(meal)}
            />
          ))}
          {todayMeals.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400 dark:border-slate-800">
              No meals configured yet. Enable reminders in Settings.
            </p>
          )}
        </div>
      </div>

      <UpdateMealSheet meal={activeMeal} onClose={() => setActiveMeal(null)} />
    </div>
  )
}
