import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppShell() {
  return (
    <div className="mx-auto min-h-dvh max-w-md pb-24">
      <Outlet />
      <BottomNav />
    </div>
  )
}
