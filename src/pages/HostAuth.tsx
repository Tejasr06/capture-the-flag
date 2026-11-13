import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, LoaderCircle, LockKeyhole, Mail, Sparkles, UserRound } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  getAuthErrorMessage,
  loginHost,
  registerHost,
} from '../services/authService'
import { isFirebaseConfigured } from '../services/firebase'

interface HostAuthProps {
  mode: 'login' | 'register'
}

function HostAuth({ mode }: HostAuthProps) {
  const isRegister = mode === 'register'
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (authLoading) {
    return <AuthLoading />
  }

  if (user) {
    return <Navigate replace to="/host/dashboard" />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (isRegister && displayName.trim().length < 2) {
      setError('Enter a display name with at least 2 non-space characters.')
      return
    }

    if (isRegister && password !== confirmPassword) {
      setError('Your passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      if (isRegister) {
        await registerHost(displayName, email, password)
      } else {
        await loginHost(email, password)
      }
      navigate('/host/dashboard', { replace: true })
    } catch (authError) {
      setError(getAuthErrorMessage(authError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b1020] px-5 py-12 text-white sm:px-8">
      <div className="pointer-events-none absolute -left-40 top-10 size-96 rounded-full bg-violet-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute -right-36 bottom-0 size-96 rounded-full bg-blue-500/10 blur-[120px]" />

      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.4 }}
      >
        <Link
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
          to="/"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Back to QuizArena
        </Link>

        <div className="rounded-3xl border border-white/10 bg-[#11172a]/95 p-6 shadow-2xl shadow-black/30 sm:p-8">
          <Link aria-label="QuizArena home" className="inline-flex items-center gap-3" to="/">
            <span className="grid size-10 place-items-center rounded-[14px] bg-gradient-to-br from-violet-400 to-indigo-600 text-lg font-black">
              Q
            </span>
            <span className="text-[17px] font-bold tracking-tight">
              Quiz<span className="text-violet-300">Arena</span>
            </span>
          </Link>

          <div className="mt-8">
            <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-violet-300 uppercase">
              <Sparkles aria-hidden="true" size={14} />
              Host account
            </span>
            <h1 className="mt-3 text-3xl font-bold tracking-tight">
              {isRegister ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {isRegister
                ? 'Set up your host profile and get ready to bring a room together.'
                : 'Sign in to pick up where your next great quiz begins.'}
            </p>
          </div>

          {!isFirebaseConfigured && (
            <div
              className="mt-6 rounded-xl border border-amber-300/20 bg-amber-300/[0.08] p-4 text-sm leading-6 text-amber-100"
              role="status"
            >
              Firebase is not configured yet. Follow the setup steps in the
              project instructions, then restart the dev server.
            </div>
          )}

          {error && (
            <div
              className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/[0.08] p-4 text-sm leading-6 text-rose-200"
              role="alert"
            >
              {error}
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {isRegister && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">
                  Display name
                </span>
                <span className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0b1020] px-3.5 focus-within:border-violet-400/60">
                  <UserRound aria-hidden="true" className="shrink-0 text-slate-500" size={17} />
                  <input
                    autoComplete="name"
                    className="min-w-0 flex-1 bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-slate-600"
                    maxLength={60}
                    minLength={2}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Your name"
                    required
                    value={displayName}
                  />
                </span>
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">
                Email address
              </span>
              <span className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0b1020] px-3.5 focus-within:border-violet-400/60">
                <Mail aria-hidden="true" className="shrink-0 text-slate-500" size={17} />
                <input
                  autoComplete="email"
                  className="min-w-0 flex-1 bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-slate-600"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={email}
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-200">
                Password
              </span>
              <span className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0b1020] px-3.5 focus-within:border-violet-400/60">
                <LockKeyhole aria-hidden="true" className="shrink-0 text-slate-500" size={17} />
                <input
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  className="min-w-0 flex-1 bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-slate-600"
                  minLength={8}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  required
                  type="password"
                  value={password}
                />
              </span>
            </label>

            {isRegister && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">
                  Confirm password
                </span>
                <span className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0b1020] px-3.5 focus-within:border-violet-400/60">
                  <LockKeyhole aria-hidden="true" className="shrink-0 text-slate-500" size={17} />
                  <input
                    autoComplete="new-password"
                    className="min-w-0 flex-1 bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-slate-600"
                    minLength={8}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Enter your password again"
                    required
                    type="password"
                    value={confirmPassword}
                  />
                </span>
              </label>
            )}

            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={submitting || !isFirebaseConfigured}
              type="submit"
            >
              {submitting ? (
                <>
                  <LoaderCircle aria-hidden="true" className="animate-spin" size={17} />
                  {isRegister ? 'Creating account…' : 'Signing in…'}
                </>
              ) : (
                <>
                  {isRegister ? 'Create host account' : 'Sign in'}
                  <ArrowRight aria-hidden="true" size={17} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            {isRegister ? 'Already have a host account?' : 'New to QuizArena?'}{' '}
            <Link
              className="font-semibold text-violet-300 transition hover:text-violet-200"
              to={isRegister ? '/host/login' : '/host/register'}
            >
              {isRegister ? 'Sign in' : 'Create one'}
            </Link>
          </p>
        </div>
      </motion.section>
    </main>
  )
}

function AuthLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0b1020] text-slate-300">
      <span className="inline-flex items-center gap-3 text-sm">
        <LoaderCircle aria-hidden="true" className="animate-spin text-violet-300" size={20} />
        Checking your session…
      </span>
    </main>
  )
}

export default HostAuth
