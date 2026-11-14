import { LogOut, LoaderCircle } from 'lucide-react'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getAuthErrorMessage, logoutHost } from '../services/authService'

function HostPageLayout() {
  const { user, loading } = useAuth()
  const { pathname } = useLocation()
  const [error, setError] = useState('')
  const [signingOut, setSigningOut] = useState(false)

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0b1020] text-slate-300">
        <span className="inline-flex items-center gap-3 text-sm">
          <LoaderCircle aria-hidden="true" className="animate-spin text-violet-300" size={20} />
          Loading your host space…
        </span>
      </main>
    )
  }

  if (!user) {
    return <Navigate replace to="/host/login" />
  }

  if (pathname.startsWith('/host/games/')) {
    return <Outlet />
  }

  async function handleSignOut() {
    setError('')
    setSigningOut(true)
    try {
      await logoutHost()
    } catch (signOutError) {
      setError(getAuthErrorMessage(signOutError))
      setSigningOut(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0b1020] px-5 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-9 flex items-center justify-between border-b border-white/10 pb-6">
          <Link className="inline-flex items-center gap-3" to="/host/dashboard">
            <span className="grid size-10 place-items-center rounded-[14px] bg-gradient-to-br from-violet-400 to-indigo-600 text-lg font-black">
              Q
            </span>
            <span className="text-[17px] font-bold tracking-tight">
              Quiz<span className="text-violet-300">Arena</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-400 sm:inline">
              {user.displayName || user.email}
            </span>
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/5 disabled:opacity-50"
              disabled={signingOut}
              onClick={handleSignOut}
              type="button"
            >
              {signingOut ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />
              ) : (
                <LogOut aria-hidden="true" size={16} />
              )}
              Sign out
            </button>
          </div>
        </header>
        {error && (
          <div className="mb-6 rounded-xl border border-rose-300/20 bg-rose-300/[0.08] p-4 text-sm text-rose-200" role="alert">
            {error}
          </div>
        )}
        <Outlet />
      </div>
    </main>
  )
}

export default HostPageLayout
