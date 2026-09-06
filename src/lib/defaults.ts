import type { ReminderSettings } from '../types'

function defaultReminderWindow(time: string): ReminderSettings['breakfast'] {
  return {
    enabled: true,
    time,
    followUpDelayMinutes: 45,
    escalateDelayMinutes: 120,
  }
}

export function defaultReminderSettings(): ReminderSettings {
  return {
    breakfast: defaultReminderWindow('08:30'),
    lunch: defaultReminderWindow('13:00'),
    dinner: defaultReminderWindow('19:30'),
    snack: { ...defaultReminderWindow('16:00'), enabled: false },
    quietHours: { enabled: true, start: '22:00', end: '07:00' },
    missedMealAlertsEnabled: true,
    tone: 'caring',
  }
}
