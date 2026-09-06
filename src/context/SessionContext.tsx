import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Profile } from '../types'
import { useData } from './DataContext'

const SESSION_KEY = 'honey-session-profile-id'

interface SessionContextValue {
  currentProfile: Profile | null
  switchProfile: (profileId: string) => void
  signOut: () => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const { profiles } = useData()
  const [profileId, setProfileId] = useState<string | null>(() => localStorage.getItem(SESSION_KEY))

  useEffect(() => {
    if (profileId) localStorage.setItem(SESSION_KEY, profileId)
    else localStorage.removeItem(SESSION_KEY)
  }, [profileId])

  const currentProfile = profiles.find((p) => p.id === profileId) ?? null

  const value: SessionContextValue = {
    currentProfile,
    switchProfile: setProfileId,
    signOut: () => setProfileId(null),
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within a SessionProvider')
  return ctx
}
