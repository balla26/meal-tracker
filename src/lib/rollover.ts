import type { MealEntry, MealType, Profile } from '../types'
import { todayKey } from './datetime'
import { makeId } from './id'
import { defaultReminderSettings } from './defaults'

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

/** Returns the meal entries that need to be created for today — one per enabled meal
 *  type per user that doesn't already have a row for today. In a server-backed app this
 *  would run as a midnight cron job; here each connected client fills the gap it notices. */
export function missingTodayEntries(profiles: Profile[], meals: MealEntry[], now: Date = new Date()) {
  const today = todayKey(now)
  const additions: Omit<MealEntry, 'id'>[] = []

  for (const profile of profiles) {
    if (profile.role !== 'user') continue
    const reminderSettings = profile.reminderSettings ?? defaultReminderSettings()
    for (const mealType of MEAL_TYPES) {
      if (!reminderSettings[mealType].enabled) continue
      const exists = meals.some((m) => m.userId === profile.id && m.mealType === mealType && m.date === today)
      if (exists) continue
      additions.push({
        userId: profile.id,
        mealType,
        date: today,
        status: 'not_updated',
        note: '',
        updatedAt: null,
        createdAt: now.toISOString(),
        snoozeUntil: null,
        reminders: { gentleSentAt: null, followUpSentAt: null, escalatedAt: null },
      })
    }
  }

  return additions
}

type EnsureTodayEntriesInput = {
  profiles: Profile[]
  meals: MealEntry[]
}

/** Ensures all expected meal entries for today exist and returns the same DB when no changes are needed. */
export function ensureTodayEntries<T extends EnsureTodayEntriesInput>(db: T, now: Date = new Date()): T {
  const additions = missingTodayEntries(db.profiles, db.meals, now)
  if (additions.length === 0) return db

  const newMeals: MealEntry[] = additions.map((entry) => ({ ...entry, id: makeId('meal') }))
  return {
    ...db,
    meals: [...db.meals, ...newMeals],
  }
}
