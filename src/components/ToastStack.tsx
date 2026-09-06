import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import type { ToastMessage } from '../types'

const ICONS: Record<ToastMessage['kind'], typeof CheckCircle2> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
}

const STYLES: Record<ToastMessage['kind'], string> = {
  success: 'bg-emerald-600 text-white',
  info: 'bg-slate-800 text-white',
  warning: 'bg-amber-600 text-white',
  error: 'bg-rose-600 text-white',
}

export function ToastStack() {
  const { toasts, dismissToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 px-4 pt-4 safe-top">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.kind]
        return (
          <div
            key={toast.id}
            role="status"
            className={`animate-slide-up pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-xl px-4 py-3 shadow-lg ${STYLES[toast.kind]}`}
          >
            <Icon size={18} className="mt-0.5 shrink-0" />
            <p className="flex-1 text-sm font-medium leading-snug">{toast.text}</p>
            <button
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
              className="shrink-0 rounded-full p-0.5 hover:bg-white/20"
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
