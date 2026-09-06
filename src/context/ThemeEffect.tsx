import { useEffect } from 'react'
import { useData } from './DataContext'

/** Applies the configured theme (light/dark/system) to the document root. Rendered once near the app root. */
export function ThemeEffect() {
  const { db } = useData()
  const theme = db.settings.theme

  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const apply = () => {
      const isDark = theme === 'dark' || (theme === 'system' && media.matches)
      root.classList.toggle('dark', isDark)
    }

    apply()
    if (theme === 'system') {
      media.addEventListener('change', apply)
      return () => media.removeEventListener('change', apply)
    }
  }, [theme])

  return null
}
