// Small, dependency-free date/time helpers. All "HH:MM" values are local 24h time.

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function daysAgoKey(daysAgo: number, from: Date = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() - daysAgo)
  return todayKey(d)
}

export function parseTimeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function minutesSinceMidnight(d: Date = new Date()): number {
  return d.getHours() * 60 + d.getMinutes()
}

/** Is `minutes` (0-1439) inside the quiet-hours window, which may wrap past midnight. */
export function isWithinQuietHours(minutes: number, start: string, end: string): boolean {
  const s = parseTimeToMinutes(start)
  const e = parseTimeToMinutes(end)
  if (s === e) return false
  if (s < e) return minutes >= s && minutes < e
  return minutes >= s || minutes < e // wraps past midnight, e.g. 22:00 - 07:00
}

export function formatTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function formatDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = todayKey()
  const yesterday = daysAgoKey(1)
  if (dateKey === today) return 'Today'
  if (dateKey === yesterday) return 'Yesterday'
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export function formatClock(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

export function greeting(d: Date = new Date()): string {
  const h = d.getHours()
  if (h < 5) return 'Still up?'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}
