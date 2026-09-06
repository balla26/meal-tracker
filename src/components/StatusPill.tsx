import type { MealStatus } from '../types'
import { STATUS_LABELS } from '../lib/reminders'

const STYLES: Record<MealStatus, string> = {
  not_updated: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  ate: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  didnt_eat: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  will_eat_later: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  missed: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
}

export function StatusPill({ status }: { status: MealStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
