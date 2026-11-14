import { motion } from 'framer-motion'
import { ArrowRight, Flag, Globe, Rocket, Sparkles, Trophy, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'

function QuizCard({
  className,
  label,
  delay,
}: {
  className: string
  label: string
  delay: number
}) {
  return (
    <motion.div
      animate={{ y: [0, -10, 0], rotate: [-3, 0, -3] }}
      className={`absolute z-10 hidden w-32 rounded-2xl border border-white/50 bg-white p-2.5 shadow-xl shadow-violet-950/30 sm:block md:w-40 ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      transition={{
        delay,
        duration: 4.5,
        ease: 'easeInOut',
        opacity: { duration: 0.5 },
        repeat: Infinity,
      }}
    >
      <div className="mb-2 flex items-center justify-between px-1 text-[10px] font-black tracking-[0.12em] text-violet-900/70 uppercase">
        <span>{label}</span>
        <Sparkles aria-hidden="true" size={13} />
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <span className="h-7 rounded-lg bg-rose-500" />
        <span className="h-7 rounded-lg bg-sky-500" />
        <span className="h-7 rounded-lg bg-amber-400" />
        <span className="h-7 rounded-lg bg-emerald-500" />
      </div>
    </motion.div>
  )
}

function Earth() {
  return (
    <svg
      aria-hidden="true"
      className="absolute bottom-[-18rem] left-1/2 z-0 w-[min(94vw,38rem)] -translate-x-1/2 sm:bottom-[-28rem] md:bottom-[-31rem]"
      fill="none"
      viewBox="0 0 400 400"
    >
      <defs>
        <linearGradient id="earth-ocean" x1="70" x2="340" y1="50" y2="370" gradientUnits="userSpaceOnUse">
          <stop stopColor="#31B8FF" />
          <stop offset="1" stopColor="#1553CF" />
        </linearGradient>
        <clipPath id="earth-clip">
          <circle cx="200" cy="200" r="188" />
        </clipPath>
      </defs>
      <circle cx="200" cy="200" r="194" fill="#A666F3" opacity=".45" />
      <circle cx="200" cy="200" r="188" fill="url(#earth-ocean)" />
      <g clipPath="url(#earth-clip)">
        <path
          d="m66 104 31-20 28 8 13 19 24 7 11 22-18 17-4 22-22 8-7 27-16 10-12-19-2-26-18-14-17-1-12-27-1-33 22 0Zm110 22 16-13 22 7 17-13 28 11 18 24-11 20-26 4-10 19-25-3-13-19-20-10 4-27Zm70 89 29-19 25 7 18 25-13 18-21-5-14 16-23-8-10-19 9-15Zm-139 46 21-16 23 10 5 23-14 17-8 35-20 24-17-14 3-31-12-19 19-29Z"
          fill="#73DC72"
        />
        <path d="m45 200 27-17 18 11-2 23-23 13-18-10-2-20Zm211-133 19-7 16 13-9 17-21-3-5-20Z" fill="#9AE879" />
        <g fill="#FFF">
          <circle cx="104" cy="132" r="7" />
          <circle cx="177" cy="101" r="6" />
          <circle cx="264" cy="148" r="7" />
          <circle cx="301" cy="221" r="6" />
          <circle cx="153" cy="262" r="7" />
          <circle cx="229" cy="303" r="6" />
        </g>
        <g fill="#FF5C75">
          <circle cx="104" cy="132" r="3" />
          <circle cx="177" cy="101" r="3" />
          <circle cx="264" cy="148" r="3" />
          <circle cx="301" cy="221" r="3" />
          <circle cx="153" cy="262" r="3" />
          <circle cx="229" cy="303" r="3" />
        </g>
      </g>
    </svg>
  )
}

function LandingPage() {
  return (
    <main className="relative isolate flex min-h-screen min-h-[100svh] flex-col items-center overflow-hidden bg-[#4b168e] px-5 pt-8 text-white sm:px-8 sm:pt-10">
      <div className="pointer-events-none absolute -left-36 -top-32 size-[26rem] rounded-full bg-[#22075f] opacity-80" />
      <div className="pointer-events-none absolute -right-52 top-[22%] size-[34rem] rounded-full bg-[#361078] opacity-80" />
      <div className="pointer-events-none absolute bottom-[-27rem] left-1/2 size-[52rem] -translate-x-1/2 rounded-full bg-[#29086e]" />

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <Sparkles className="absolute left-[8%] top-[15%] text-fuchsia-300/70" size={22} />
        <Sparkles className="absolute left-[17%] top-[57%] text-violet-200/70" size={19} />
        <Sparkles className="absolute right-[17%] top-[19%] text-fuchsia-200/70" size={24} />
        <Sparkles className="absolute right-[9%] top-[55%] text-violet-200/70" size={17} />
        <span className="absolute left-[29%] top-[13%] size-2 rounded-full bg-white/80" />
        <span className="absolute right-[31%] top-[34%] size-1.5 rounded-full bg-amber-200" />
        <span className="absolute left-[6%] top-[39%] size-1.5 rounded-full bg-sky-200" />
        <span className="absolute right-[6%] top-[38%] size-2 rounded-full bg-fuchsia-200" />
      </div>

      <QuizCard className="left-[7%] top-[26%] lg:left-[13%]" delay={0.1} label="ROUND 01" />
      <QuizCard className="right-[7%] top-[47%] lg:right-[13%]" delay={0.7} label="BONUS ROUND" />

      <motion.div
        animate={{ x: [0, 7, 0], y: [0, -5, 0], rotate: [-12, -6, -12] }}
        className="absolute right-[16%] top-[13%] hidden text-amber-200 drop-shadow-[0_8px_14px_rgba(27,4,80,0.5)] sm:block"
        transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
      >
        <div className="absolute -left-16 top-6 h-1 w-16 rotate-[28deg] rounded-full bg-gradient-to-r from-transparent via-orange-300 to-amber-100" />
        <Rocket aria-hidden="true" fill="#ffd166" size={52} strokeWidth={1.5} />
      </motion.div>

      <header className="relative z-20 flex w-full max-w-7xl items-center justify-between">
        <Link aria-label="QuizArena home" className="inline-flex items-center gap-2 font-black tracking-tight" to="/">
          <span className="grid size-10 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20">
            <Flag aria-hidden="true" size={21} />
          </span>
          <span className="text-sm sm:text-base">QUIZARENA</span>
        </Link>
        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-bold tracking-[0.16em] text-violet-100 sm:text-xs">
          READY, SET, PLAY
        </span>
      </header>

      <section className="relative z-20 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center pt-[clamp(5rem,15vh,10rem)] text-center">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-violet-100 shadow-lg shadow-violet-950/10 sm:text-sm"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.5 }}
        >
          <Zap aria-hidden="true" className="text-amber-300" fill="currentColor" size={15} />
          The ultimate live quiz adventure
        </motion.div>
        <motion.h1
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="w-full max-w-5xl text-[clamp(2.4rem,10vw,8.5rem)] leading-[0.9] font-black tracking-[-0.075em] text-white [text-shadow:0_8px_0_rgba(35,6,95,0.55),0_18px_40px_rgba(25,4,70,0.3)]"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ delay: 0.1, duration: 0.7, ease: 'easeOut' }}
        >
          Capture the Flag!
        </motion.h1>
        <motion.p
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 max-w-lg text-base leading-7 text-violet-100/90 sm:text-lg"
          initial={{ opacity: 0, y: 12 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          Rally your team, test your wits, and race to the top of the leaderboard.
        </motion.p>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row"
          initial={{ opacity: 0, y: 12 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          <Link
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-black text-violet-900 shadow-xl shadow-violet-950/30 transition hover:-translate-y-0.5 hover:bg-violet-100 sm:text-base"
            to="/join"
          >
            Join a game
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
          <Link
            className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15 sm:text-base"
            to="/host/login"
          >
            <Trophy aria-hidden="true" size={17} />
            Host a game
          </Link>
        </motion.div>
      </section>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-[#4b168e]/35 to-transparent" />
      <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 text-xs font-semibold text-violet-100/75">
        <Globe aria-hidden="true" size={15} />
        One quiz. One flag. Your team.
      </div>
      <Earth />
    </main>
  )
}

export default LandingPage
