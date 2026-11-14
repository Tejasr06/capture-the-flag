import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Flag, LoaderCircle } from 'lucide-react'
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
    <main className="relative flex min-h-screen min-h-[100svh] items-center justify-center overflow-hidden bg-[#351078] px-5 py-10 text-white">
      <div className="pointer-events-none absolute -left-56 -top-56 size-[42rem] rotate-45 bg-[#2b0b63]/70" />
      <div className="pointer-events-none absolute -right-72 -bottom-80 size-[48rem] rounded-full border-[4rem] border-[#2b0b63]/40" />
      <div className="pointer-events-none absolute -bottom-56 left-[42%] size-[34rem] rounded-full bg-[#46168e]/45" />

      <section className="relative z-10 w-full max-w-sm">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-7 flex justify-center"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <Link aria-label="Capture the Flag home" className="inline-flex items-center gap-3 text-white" to="/">
            <span className="grid size-12 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <Flag aria-hidden="true" size={25} />
            </span>
            <span className="text-2xl font-black tracking-[-0.06em] sm:text-3xl">Capture the Flag!</span>
          </Link>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="rounded-md bg-white p-4 shadow-2xl shadow-[#200650]/40 sm:p-5"
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          transition={{ delay: 0.08, duration: 0.5, ease: 'easeOut' }}
        >
          {error && (
            <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm leading-5 text-rose-700" role="alert">
              {error}
            </div>
          )}

          <form className="space-y-2.5" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="game-pin">Game PIN</label>
            <input
              autoComplete="one-time-code"
              className="h-12 w-full rounded-md border-2 border-[#d1d1d1] bg-white px-3 text-center text-lg font-bold tracking-[0.12em] text-slate-800 outline-none transition placeholder:tracking-normal placeholder:text-slate-400 focus:border-violet-500"
              id="game-pin"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => {
                setPin(event.target.value.replace(/\D/g, '').slice(0, 6))
                setError('')
              }}
              pattern="\d{6}"
              placeholder="Game PIN"
              required
              value={pin}
            />

            <label className="sr-only" htmlFor="nickname">Your nickname</label>
            <input
              autoComplete="nickname"
              className="h-12 w-full rounded-md border-2 border-[#d1d1d1] bg-white px-3 text-center text-base font-semibold text-slate-800 outline-none transition placeholder:font-semibold placeholder:text-slate-400 focus:border-violet-500"
              id="nickname"
              maxLength={20}
              minLength={2}
              onChange={(event) => {
                setNickname(event.target.value)
                setError('')
              }}
              placeholder="Your nickname"
              required
              value={nickname}
            />

            <button
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#292929] px-5 text-sm font-bold text-white transition hover:bg-[#171717] disabled:cursor-not-allowed disabled:opacity-55"
              disabled={joining || pin.length !== 6 || nickname.trim().length < 2}
              type="submit"
            >
              {joining ? (
                <>
                  <LoaderCircle aria-hidden="true" className="animate-spin" size={17} />
                  Joining…
                </>
              ) : (
                'Enter'
              )}
            </button>
          </form>
        </motion.div>
      </section>
    </main>
  )
}

export default JoinGame
