import { useEffect, type ReactNode } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { Crown, Flag, Medal, Sparkles } from 'lucide-react'
import ParticipantAvatar from './ParticipantAvatar'
import type { LiveScore } from '../types/game'
import { rankLiveScores } from '../utils/leaderboard'

interface FinalLeaderboardProps {
  scores: LiveScore[]
  currentUid?: string
  error?: string
  footer?: ReactNode
}

function AnimatedTotalScore({ totalPoints }: { totalPoints: number }) {
  const score = useMotionValue(0)
  const formattedScore = useTransform(score, (value) => Math.round(value).toLocaleString())

  useEffect(() => {
    const controls = animate(score, totalPoints, { delay: 0.3, duration: 1.1, ease: 'easeOut' })
    return () => controls.stop()
  }, [score, totalPoints])

  return <motion.span>{formattedScore}</motion.span>
}

function FinalLeaderboard({ scores, currentUid, error, footer }: FinalLeaderboardProps) {
  const rankedScores = rankLiveScores(scores)
  const featuredScores = rankedScores.slice(0, 2)
  const remainingTopTen = rankedScores.slice(2, 10)

  return (
    <main className="relative isolate flex min-h-screen min-h-[100svh] items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-[#351273] via-[#29105e] to-[#160d2c] px-4 py-10 text-white sm:px-7">
      <div className="pointer-events-none absolute -left-36 -top-56 size-[30rem] rounded-full bg-violet-300/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-36 -top-48 size-[28rem] rotate-45 bg-violet-200/[0.08] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -left-32 size-[34rem] bg-violet-300/[0.09] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-64 -right-40 size-[34rem] rounded-full bg-violet-300/10 blur-3xl" />

      <section aria-label="Final leaderboard" className="relative z-10 w-full max-w-4xl">
        <motion.header
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
          initial={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <div className="inline-flex items-center gap-2 text-sm font-black tracking-tight text-violet-100 sm:text-base">
            <Flag aria-hidden="true" size={18} />
            Capture the Flag!
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Final leaderboard</h1>
          <p className="mt-2 text-sm font-medium text-violet-100/75 sm:text-base">
            The final standings are in
          </p>
          <div className="mx-auto mt-6 h-px w-full max-w-3xl bg-white/25" />
        </motion.header>

        {error && (
          <div className="mx-auto mt-5 max-w-3xl rounded-xl border border-rose-200/20 bg-rose-300/10 p-4 text-sm text-rose-100" role="alert">
            {error}
          </div>
        )}

        {rankedScores.length === 0 ? (
          <p className="py-16 text-center text-sm text-violet-100/80" role="status">
            Waiting for final scores…
          </p>
        ) : (
          <>
            <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
              {featuredScores.map((score, index) => {
                const isWinner = index === 0
                const PlaceIcon = isWinner ? Crown : Medal

                return (
                  <motion.article
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`relative isolate flex min-h-64 flex-col items-center justify-center overflow-hidden rounded-3xl border p-6 text-center shadow-2xl ${
                      isWinner
                        ? 'border-amber-100/80 bg-gradient-to-br from-amber-100 via-amber-50 to-white text-slate-950 shadow-amber-950/20 sm:min-h-72'
                        : 'border-slate-100/70 bg-gradient-to-br from-slate-100 via-white to-violet-100 text-slate-900 shadow-violet-950/20'
                    }`}
                    initial={{ opacity: 0, y: 40, scale: 0.92 }}
                    key={score.uid}
                    transition={{
                      delay: isWinner ? 0.2 : 0.38,
                      duration: 0.65,
                      type: 'spring',
                      stiffness: 120,
                      damping: 16,
                    }}
                  >
                    <div
                      className={`pointer-events-none absolute -right-12 -top-14 size-40 rounded-full blur-2xl ${
                        isWinner ? 'bg-amber-300/50' : 'bg-violet-300/45'
                      }`}
                    />
                    {isWinner && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        className="pointer-events-none absolute right-8 top-8 text-amber-500/45"
                        transition={{ duration: 18, ease: 'linear', repeat: Infinity }}
                      >
                        <Sparkles aria-hidden="true" size={24} />
                      </motion.div>
                    )}
                    <span
                      className={`relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-black tracking-[0.16em] uppercase ${
                        isWinner ? 'bg-amber-200/80 text-amber-950' : 'bg-violet-100 text-violet-950'
                      }`}
                    >
                      <PlaceIcon aria-hidden="true" size={15} />
                      {isWinner ? 'Winner' : 'Runner-up'}
                    </span>
                    <span className="relative mt-5">
                      <ParticipantAvatar avatarId={score.avatarId} size="lg" uid={score.uid} />
                      <span
                        className={`absolute -bottom-2 -right-2 grid size-8 place-items-center rounded-full border-2 text-sm font-black ${
                          isWinner
                            ? 'border-amber-50 bg-amber-500 text-white'
                            : 'border-white bg-violet-700 text-white'
                        }`}
                      >
                        {index + 1}
                      </span>
                    </span>
                    <h2 className="relative mt-4 max-w-full truncate text-2xl font-black tracking-tight sm:text-3xl">
                      {score.nickname}
                      {score.uid === currentUid && <span className="ml-2 text-sm font-bold opacity-70">(You)</span>}
                    </h2>
                    <p className={`relative mt-2 text-sm font-bold ${isWinner ? 'text-amber-900/75' : 'text-violet-900/70'}`}>
                      <span className="inline-flex items-baseline gap-1.5">
                        <AnimatedTotalScore totalPoints={score.totalPoints} />
                        <span>points</span>
                      </span>
                    </p>
                  </motion.article>
                )
              })}
            </div>

            {remainingTopTen.length > 0 && (
              <motion.section
                animate={{ opacity: 1, y: 0 }}
                aria-label="Remaining top ten standings"
                className="mx-auto mt-8 max-w-3xl"
                initial={{ opacity: 0, y: 18 }}
                transition={{ delay: 0.48, duration: 0.45 }}
              >
                <h2 className="mb-3 flex items-center gap-2 text-lg font-black sm:text-xl">
                  <Sparkles aria-hidden="true" className="text-violet-200" size={18} />
                  The rest of the top 10
                </h2>
                <ol aria-label="Ranks three through ten" className="space-y-2">
                  {remainingTopTen.map((score, index) => (
                    <motion.li
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2.5 shadow-lg shadow-black/10 sm:gap-4 sm:px-5 ${
                        score.uid === currentUid
                          ? 'border-violet-200/50 bg-violet-400/20 text-white'
                          : 'border-white/10 bg-white/[0.06] text-violet-50'
                      }`}
                      initial={{ opacity: 0, x: -18 }}
                      key={score.uid}
                      transition={{ delay: 0.55 + index * 0.07, duration: 0.35, ease: 'easeOut' }}
                    >
                      <span className="w-8 shrink-0 text-sm font-black tabular-nums text-violet-200">
                        {index + 3}.
                      </span>
                      <ParticipantAvatar avatarId={score.avatarId} size="sm" uid={score.uid} />
                      <span className="min-w-0 flex-1 truncate text-sm font-bold sm:text-base">
                        {score.nickname}
                        {score.uid === currentUid && <span className="ml-2 text-xs text-violet-200">(You)</span>}
                      </span>
                      <span className="shrink-0 text-right text-sm font-black tabular-nums sm:text-base">
                        {score.totalPoints.toLocaleString()}
                        <span className="ml-1 text-xs font-semibold text-violet-200/80">pts</span>
                      </span>
                    </motion.li>
                  ))}
                </ol>
              </motion.section>
            )}
          </>
        )}

        {footer && <div className="mt-8 flex justify-center">{footer}</div>}
      </section>
    </main>
  )
}

export default FinalLeaderboard
