import { useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, LoaderCircle, LockKeyhole, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { getLiveGameErrorMessage, joinLiveGame } from '../services/gameService'

function JoinGame() {
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setJoining(true)
    try {
      await joinLiveGame(pin, nickname)
      navigate(`/play/${pin}`, { replace: true })
    } catch (joinError) {
      setError(getLiveGameErrorMessage(joinError))
    } finally {
      setJoining(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b1020] px-5 py-12 text-white sm:px-8">
      <div className="pointer-events-none absolute -left-40 top-10 size-96 rounded-full bg-violet-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute -right-36 bottom-0 size-96 rounded-full bg-blue-500/10 blur-[120px]" />

      <section className="relative w-full max-w-md">
        <Link
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
          to="/"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Back to QuizArena
        </Link>
        <div className="rounded-3xl border border-white/10 bg-[#11172a]/95 p-6 shadow-2xl shadow-black/30 sm:p-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-violet-400/10 text-violet-200">
            <Users aria-hidden="true" size={22} />
          </span>
          <h1 className="mt-6 text-3xl font-black tracking-tight">Join a game</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Enter the six-digit PIN from your host and choose a nickname for the leaderboard.
          </p>

          {error && (
            <div className="mt-6 rounded-xl border border-rose-300/20 bg-rose-300/[0.08] p-4 text-sm leading-6 text-rose-200" role="alert">
              {error}
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Game PIN</span>
              <span className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0b1020] px-4 focus-within:border-violet-400/60">
                <LockKeyhole aria-hidden="true" className="shrink-0 text-slate-500" size={17} />
                <input
                  autoComplete="one-time-code"
                  className="w-full bg-transparent py-4 text-center text-2xl font-black tracking-[0.3em] text-white outline-none placeholder:text-slate-700"
                  inputMode="numeric"
                  maxLength={6}
                  onChange={(event) => {
                    setPin(event.target.value.replace(/\D/g, '').slice(0, 6))
                    setError('')
                  }}
                  pattern="\d{6}"
                  placeholder="000000"
                  required
                  value={pin}
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Nickname</span>
              <input
                autoComplete="nickname"
                className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-600 focus:border-violet-400/60"
                maxLength={20}
                minLength={2}
                onChange={(event) => {
                  setNickname(event.target.value)
                  setError('')
                }}
                placeholder="Choose a name for this game"
                required
                value={nickname}
              />
              <span className="mt-2 block text-xs text-slate-500">2–20 characters; letters, numbers, spaces, dots, dashes, or underscores.</span>
            </label>

            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={joining || pin.length !== 6}
              type="submit"
            >
              {joining ? (
                <>
                  <LoaderCircle aria-hidden="true" className="animate-spin" size={17} />
                  Joining the lobby…
                </>
              ) : (
                <>
                  Join waiting room
                  <ArrowRight aria-hidden="true" size={17} />
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-xs leading-5 text-slate-500">
            No account needed. QuizArena uses a temporary anonymous session to keep your place in the game.
          </p>
        </div>
      </section>
    </main>
  )
}

export default JoinGame
