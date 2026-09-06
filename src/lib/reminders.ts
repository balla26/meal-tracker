import type { AlertEntry, CareTone, HoneyDatabase, MealEntry, MealType } from '../types'
import { makeId } from './id'
import { isWithinQuietHours, minutesSinceMidnight, parseTimeToMinutes, todayKey } from './datetime'

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

export const STATUS_LABELS: Record<MealEntry['status'], string> = {
  not_updated: 'Not updated',
  ate: 'Ate',
  didnt_eat: "Didn't eat",
  will_eat_later: 'Will eat later',
  missed: 'Missed',
}

export const QUICK_REPLIES: Array<{ status: MealEntry['status']; label: string }> = [
  { status: 'ate', label: 'Already ate 😌' },
  { status: 'will_eat_later', label: 'Eating now 🍴' },
  { status: 'will_eat_later', label: 'Will eat soon ⏳' },
  { status: 'didnt_eat', label: "Didn't eat ❌" },
]

const GENTLE_TEMPLATES: Record<CareTone, (meal: string) => string> = {
  caring: (meal) => `Just checking in — have you had ${meal.toLowerCase()} yet? 💛`,
  funny: (meal) => `${meal} department is requesting a status update. 🕵️`,
  cute: (meal) => `Food check! 🍱 Have you had ${meal.toLowerCase()}?`,
  professional: (meal) => `${meal} status has not been updated.`,
  strict: () => `Meal update required.`,
}

const FOLLOW_UP_TEMPLATES: Record<CareTone, (meal: string) => string> = {
  caring: (meal) => `Still thinking of you — any update on ${meal.toLowerCase()}?`,
  funny: (meal) => `${meal} is getting suspicious about your silence. 👀`,
  cute: (meal) => `Tiny nudge 🐝 — ${meal.toLowerCase()} status, please?`,
  professional: (meal) => `Reminder: ${meal.toLowerCase()} status is still pending.`,
  strict: (meal) => `Second notice: update ${meal.toLowerCase()} status now.`,
}

export function gentleReminderText(mealType: MealType, tone: CareTone): string {
  return GENTLE_TEMPLATES[tone](MEAL_LABELS[mealType])
}

export function followUpReminderText(mealType: MealType, tone: CareTone): string {
  return FOLLOW_UP_TEMPLATES[tone](MEAL_LABELS[mealType])
}

export function engineerAlertText(mealType: MealType): string {
  return `${MEAL_LABELS[mealType]} has not been updated within the configured window.`
}

export function celebrationText(): string {
  return 'All meals updated today! 🎉'
}

export interface ReminderTickResult {
  db: HoneyDatabase
  gentleReminders: MealEntry[]
  followUpReminders: MealEntry[]
  newAlerts: AlertEntry[]
}

/**
 * Evaluates every "today" meal entry for every user against the configured reminder
 * windows and produces: gentle reminders, follow-up reminders, and escalation alerts
 * for the AI Engineer — implementing the escalation flow in SRS section 6.6.
 * Pure function: takes the current db + now, returns an updated db plus what fired,
 * so the caller decides how to surface notifications/toasts.
 */
export function evaluateReminders(db: HoneyDatabase, now: Date = new Date()): ReminderTickResult {
  const today = todayKey(now)
  const nowMinutes = minutesSinceMidnight(now)
  const { reminders } = db.settings
  const inQuietHours =
    reminders.quietHours.enabled && isWithinQuietHours(nowMinutes, reminders.quietHours.start, reminders.quietHours.end)

  const gentleReminders: MealEntry[] = []
  const followUpReminders: MealEntry[] = []
  const newAlerts: AlertEntry[] = []

  const nextMeals = db.meals.map((meal): MealEntry => {
    if (meal.date !== today) return meal
    if (meal.status !== 'not_updated') return meal

    const config = reminders[meal.mealType]
    if (!config.enabled) return meal

    if (meal.snoozeUntil && new Date(meal.snoozeUntil).getTime() > now.getTime()) return meal
    if (inQuietHours) return meal

    const windowMinutes = parseTimeToMinutes(config.time)
    const minutesSinceWindow = nowMinutes - windowMinutes
    if (minutesSinceWindow < 0) return meal

    let next = meal

    if (!next.reminders.gentleSentAt) {
      next = { ...next, reminders: { ...next.reminders, gentleSentAt: now.toISOString() } }
      gentleReminders.push(next)
    } else if (!next.reminders.followUpSentAt && minutesSinceWindow >= config.followUpDelayMinutes) {
      next = { ...next, reminders: { ...next.reminders, followUpSentAt: now.toISOString() } }
      followUpReminders.push(next)
    } else if (
      !next.reminders.escalatedAt &&
      minutesSinceWindow >= config.escalateDelayMinutes &&
      reminders.missedMealAlertsEnabled
    ) {
      next = {
        ...next,
        status: 'missed',
        reminders: { ...next.reminders, escalatedAt: now.toISOString() },
      }
      const profile = db.profiles.find((p) => p.id === next.userId)
      if (profile?.shareWithEngineer) {
        newAlerts.push({
          id: makeId('alert'),
          userId: next.userId,
          mealId: next.id,
          mealType: next.mealType,
          trigger: 'missed_meal',
          message: engineerAlertText(next.mealType),
          createdAt: now.toISOString(),
          read: false,
        })
      }
    }

    return next
  })

  if (newAlerts.length === 0 && gentleReminders.length === 0 && followUpReminders.length === 0) {
    return { db, gentleReminders, followUpReminders, newAlerts }
  }

  return {
    db: { ...db, meals: nextMeals, alerts: [...newAlerts, ...db.alerts] },
    gentleReminders,
    followUpReminders,
    newAlerts,
  }
}

/** Cancels any pending reminder/escalation state once a meal is updated by the user. */
export function clearReminderState(meal: MealEntry): MealEntry {
  return {
    ...meal,
    snoozeUntil: null,
  }
}
