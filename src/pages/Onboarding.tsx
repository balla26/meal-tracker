import { useState } from 'react'
import { HeartHandshake, User as UserIcon, ShieldCheck } from 'lucide-react'
import { useData } from '../context/DataContext'
import { useSession } from '../context/SessionContext'
import type { Role } from '../types'

export function Onboarding() {
  const { profiles, createProfile } = useData()
  const { switchProfile } = useSession()
  const [showCreate, setShowCreate] = useState(profiles.length === 0)
  const [role, setRole] = useState<Role>('user')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const profile = createProfile(role, name.trim(), email.trim() || `${name.trim().toLowerCase()}@local`)
    switchProfile(profile.id)
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-honey-50 to-white px-6 py-10 dark:from-slate-950 dark:to-slate-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-honey-500 text-3xl shadow-lg shadow-honey-500/30">
            🍯
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Honey</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            A caring meal check-in — no more "did you eat?" texts.
          </p>
        </div>

        {!showCreate && (
          <div className="space-y-3">
            <p className="text-center text-sm font-medium text-slate-500 dark:text-slate-400">Continue as</p>
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => switchProfile(p.id)}
                className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-colors hover:border-honey-300 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-honey-100 text-honey-700 dark:bg-honey-900/40 dark:text-honey-300">
                  {p.role === 'engineer' ? <ShieldCheck size={18} /> : <UserIcon size={18} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-50">{p.name}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {p.role === 'engineer' ? 'Care companion' : 'Meal tracker'} · {p.email}
                  </p>
                </div>
              </button>
            ))}
            <button
              onClick={() => setShowCreate(true)}
              className="w-full rounded-2xl border border-dashed border-slate-300 p-4 text-sm font-medium text-slate-500 hover:border-honey-400 hover:text-honey-600 dark:border-slate-700 dark:text-slate-400"
            >
              + Add another profile
            </button>
          </div>
        )}

        {showCreate && (
          <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setRole('user')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${
                  role === 'user' ? 'bg-white text-honey-700 shadow dark:bg-slate-900 dark:text-honey-300' : 'text-slate-500'
                }`}
              >
                <UserIcon size={16} /> User
              </button>
              <button
                type="button"
                onClick={() => setRole('engineer')}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${
                  role === 'engineer' ? 'bg-white text-honey-700 shadow dark:bg-slate-900 dark:text-honey-300' : 'text-slate-500'
                }`}
              >
                <HeartHandshake size={16} /> Care companion
              </button>
            </div>

            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                Name
              </label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-honey-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">
                Email <span className="text-slate-400">(optional)</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm focus:border-honey-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-honey-500 py-3 text-sm font-semibold text-white shadow-sm shadow-honey-500/30 transition-colors hover:bg-honey-600"
            >
              Get started
            </button>
            {profiles.length > 0 && (
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="w-full text-center text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Back to profile list
              </button>
            )}
          </form>
        )}

        <p className="mt-6 text-center text-xs text-slate-400 dark:text-slate-600">
          Everything stays on this device — there's no server. Link a local file in Settings to keep a real backup.
        </p>
      </div>
    </div>
  )
}
