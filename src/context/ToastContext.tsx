import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import type { ToastMessage } from '../types'
import { makeId } from '../lib/id'

interface ToastContextValue {
  toasts: ToastMessage[]
  showToast: (text: string, kind?: ToastMessage['kind']) => void
  dismissToast: (id: string) => void
}

const MAX_VISIBLE_TOASTS = 3

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (text: string, kind: ToastMessage['kind'] = 'success') => {
      const id = makeId('toast')
      setToasts((prev) => [...prev, { id, text, kind }].slice(-MAX_VISIBLE_TOASTS))
      window.setTimeout(() => dismissToast(id), 3200)
    },
    [dismissToast],
  )

  return <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>{children}</ToastContext.Provider>
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
