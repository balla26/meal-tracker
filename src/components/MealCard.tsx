import { Coffee, Sandwich, UtensilsCrossed, Cookie, Clock, ChevronRight } from 'lucide-react'
import type { MealEntry, MealType } from '../types'
import { StatusPill } from './StatusPill'
import { MEAL_LABELS } from '../lib/reminders'
import { formatTime } from '../lib/datetime'

const ICONS: Record<MealType, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Sandwich,
  dinner: UtensilsCrossed,
  snack: Cookie,
}

export function MealCard({
  meal,
  reminderTime,
  onOpenDetails,
}: {
  meal: MealEntry
  reminderTime?: string
  onOpenDetails: () => void
}) {
  const Icon = ICONS[meal.mealType]
  const isPending = meal.status === 'not_updated'
  const isMissed = meal.status === 'missed'

  return (
    <button
      onClick={onOpenDetails}
      className={`group flex w-full items-center gap-3 rounded-2xl border p-4 text-left shadow-sm transition-all active:scale-[0.98] ${
        isMissed
          ? 'border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30'
          : 'border-slate-200 bg-white hover:border-honey-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-honey-700'
      }`}
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
          isPending || isMissed
            ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
            : 'bg-honey-100 text-honey-700 dark:bg-honey-900/40 dark:text-honey-300'
        }`}
      >
        <Icon size={22} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-slate-900 dark:text-slate-50">{MEAL_LABELS[meal.mealType]}</p>
          <StatusPill status={meal.status} />
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <Clock size={12} />
          {meal.updatedAt ? `Updated ${formatTime(meal.updatedAt)}` : reminderTime ? `Expected around ${reminderTime}` : 'No reminder set'}
        </p>
        {meal.note && <p className="mt-1 truncate text-xs italic text-slate-400 dark:text-slate-500">"{meal.note}"</p>}
      </div>

      <ChevronRight size={18} className="shrink-0 text-slate-300 group-hover:text-honey-500 dark:text-slate-600" />
    </button>
  )
}
