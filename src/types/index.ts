// Domain types for Honey — meal check-in & care app.
// Backed by Firebase: profiles/meals/alerts are Firestore collections synced in
// real time; `id` fields match Firestore document IDs (profiles use the Firebase
// Auth uid as their document ID).

export type Role = 'user' | 'engineer'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export type MealStatus = 'not_updated' | 'ate' | 'didnt_eat' | 'will_eat_later' | 'missed'

export type CareTone = 'caring' | 'funny' | 'cute' | 'professional' | 'strict'

export interface ReminderWindowConfig {
  enabled: boolean
  time: string // "HH:MM" 24h, local time
  followUpDelayMinutes: number
  escalateDelayMinutes: number
}

export interface ReminderSettings {
  breakfast: ReminderWindowConfig
  lunch: ReminderWindowConfig
  dinner: ReminderWindowConfig
  snack: ReminderWindowConfig
  quietHours: {
    enabled: boolean
    start: string // "HH:MM"
    end: string // "HH:MM"
  }
  missedMealAlertsEnabled: boolean
  tone: CareTone
}

export interface Profile {
  id: string // Firebase Auth uid
  role: Role
  name: string
  email: string
  timezone: string
  createdAt: string // ISO timestamp
  /** When false, engineer profiles cannot see this user's meal data (section 8: privacy/consent). */
  shareWithEngineer: boolean
  reminderSettings: ReminderSettings
}

export interface MealEntry {
  id: string
  userId: string
  mealType: MealType
  /** Calendar date the entry belongs to, YYYY-MM-DD, in the user's local time. */
  date: string
  status: MealStatus
  note: string
  updatedAt: string | null // ISO timestamp of the last status change, null if never updated
  createdAt: string // ISO timestamp the entry was first created (usually at day rollover)
  snoozeUntil: string | null // ISO timestamp; reminders suppressed until this time
  reminders: {
    gentleSentAt: string | null
    followUpSentAt: string | null
    escalatedAt: string | null
  }
}

export type AlertTrigger = 'missed_meal' | 'engineer_reminder_sent'

export interface AlertEntry {
  id: string
  userId: string
  mealId: string
  mealType: MealType
  trigger: AlertTrigger
  message: string
  createdAt: string // ISO timestamp
  /** True once shown/acknowledged in the engineer dashboard. */
  read: boolean
}

export type Theme = 'light' | 'dark' | 'system'

export interface AppSettings {
  theme: Theme
  reminders: ReminderSettings
}

export interface HoneyDatabase {
  profiles: Profile[]
  meals: MealEntry[]
  alerts: AlertEntry[]
  settings: AppSettings
}

export interface ToastMessage {
  id: string
  kind: 'success' | 'info' | 'warning' | 'error'
  text: string
}
