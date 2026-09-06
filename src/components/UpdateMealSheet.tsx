import { useEffect, useState } from 'react'
import type { MealEntry, MealStatus } from '../types'
import { Sheet } from './Sheet'
import { MEAL_LABELS, QUICK_REPLIES } from '../lib/reminders'
import { useData } from '../context/DataContext'

const STATUS_BUTTONS: Array<{ status: MealStatus; label: string; className: string }> = [
  { status: 'ate', label: 'Ate 😌', className: 'bg-emerald-600 hover:bg-emerald-700' },
  { status: 'will_eat_later', label: 'Will eat later ⏳', className: 'bg-amber-500 hover:bg-amber-600' },
  { status: 'didnt_eat', label: "Didn't eat ❌", className: 'bg-rose-600 hover:bg-rose-700' },
]

export function UpdateMealSheet({ meal, onClose }: { meal: MealEntry | null; onClose: () => void }) {
  const { updateMealStatus, snoozeMeal } = useData()
  const [note, setNote] = useState('')

  useEffect(() => {
    setNote(meal?.note ?? '')
  }, [meal])

  if (!meal) return null

  const save = (status: MealStatus) => {
    updateMealStatus(meal.id, status, note.trim())
    onClose()
  }

  return (
    <Sheet open={!!meal} onClose={onClose} title={MEAL_LABELS[meal.mealType]}>
      <div className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">Quick reply</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_REPLIES.map((reply, i) => (
              <button
                key={i}
                onClick={() => save(reply.status)}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-honey-400 hover:bg-honey-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {reply.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="meal-note" className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">
            Note (optional)
          </label>
          <textarea
            id="meal-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Had a salad at the office"
            rows={2}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-honey-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="grid grid-cols-1 gap-2">
          {STATUS_BUTTONS.map(({ status, label, className }) => (
            <button
              key={status}
              onClick={() => save(status)}
              className={`rounded-xl py-3 text-center text-sm font-semibold text-white transition-colors ${className}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
          <span className="text-sm text-slate-500 dark:text-slate-400">Not ready to update?</span>
          <div className="flex gap-2">
            {[15, 30, 60].map((m) => (
              <button
                key={m}
                onClick={() => {
                  snoozeMeal(meal.id, m)
                  onClose()
                }}
                className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                +{m}m
              </button>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  )
}
