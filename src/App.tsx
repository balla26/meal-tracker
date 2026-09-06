import { useEffect, useRef } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Onboarding } from './pages/Onboarding'
import { Home } from './pages/Home'
import { History } from './pages/History'
import { CareDashboard } from './pages/CareDashboard'
import { Settings } from './pages/Settings'
import { useSession } from './context/SessionContext'
import { ThemeEffect } from './context/ThemeEffect'
import { ToastStack } from './components/ToastStack'

export default function App() {
  const { currentProfile } = useSession()
  const navigate = useNavigate()
  const prevProfileId = useRef<string | null | undefined>(undefined)

  // Send the user to their role's home whenever they sign in or switch profiles —
  // but not on a plain page refresh, where the route should stay put.
  useEffect(() => {
    const id = currentProfile?.id ?? null
    if (prevProfileId.current !== undefined && prevProfileId.current !== id && id !== null) {
      navigate('/', { replace: true })
    }
    prevProfileId.current = id
  }, [currentProfile, navigate])

  return (
    <>
      <ThemeEffect />
      <ToastStack />
      {!currentProfile ? (
        <Onboarding />
      ) : (
        <Routes>
          <Route element={<AppShell />}>
            {currentProfile.role === 'engineer' ? (
              <>
                <Route index element={<Navigate to="/care" replace />} />
                <Route path="/care" element={<CareDashboard />} />
              </>
            ) : (
              <Route index element={<Home />} />
            )}
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      )}
    </>
  )
}
