import { NavLink } from 'react-router-dom'
import { Home, History, ShieldCheck, Settings } from 'lucide-react'
import { useSession } from '../context/SessionContext'

export function BottomNav() {
  const { currentProfile } = useSession()
  const isEngineer = currentProfile?.role === 'engineer'

  const items = isEngineer
    ? [
        { to: '/care', label: 'Care', icon: ShieldCheck },
        { to: '/history', label: 'History', icon: History },
        { to: '/settings', label: 'Settings', icon: Settings },
      ]
    : [
        { to: '/', label: 'Home', icon: Home },
        { to: '/history', label: 'History', icon: History },
        { to: '/settings', label: 'Settings', icon: Settings },
      ]

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur safe-bottom dark:border-slate-800 dark:bg-slate-900/95"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-honey-600 dark:text-honey-400' : 'text-slate-400 dark:text-slate-500'
                }`
              }
            >
              <Icon size={22} strokeWidth={2.25} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
