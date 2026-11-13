import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

function LandingPage() {
  return (
    <main className="relative grid min-h-screen overflow-hidden bg-gradient-to-br from-violet-950 via-violet-800 to-indigo-900 px-5 py-12 text-white sm:px-8">
      <div className="pointer-events-none absolute -left-40 top-0 size-[32rem] rounded-full bg-fuchsia-500/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 size-[32rem] rounded-full bg-indigo-400/20 blur-[120px]" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center justify-center text-center">
        <motion.h1
          animate={{ opacity: 1, y: 0 }}
          className="text-[clamp(3.5rem,11vw,9rem)] leading-[0.95] font-black tracking-[-0.07em] text-white"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          Capture the flag!
        </motion.h1>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-bold text-violet-900 shadow-xl shadow-violet-950/30 transition hover:-translate-y-0.5 hover:bg-violet-100"
            to="/join"
          >
            Join a game
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
          <Link
            className="inline-flex min-h-12 items-center rounded-2xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/15"
            to="/host/login"
          >
            Host sign in
          </Link>
        </div>
      </div>
    </main>
  )
}

export default LandingPage
