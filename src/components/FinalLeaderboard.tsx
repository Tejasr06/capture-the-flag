import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Flag } from 'lucide-react'
import ParticipantAvatar from './ParticipantAvatar'
import type { LiveScore } from '../types/game'
import { rankLiveScores } from '../utils/leaderboard'

interface FinalLeaderboardProps {
  scores: LiveScore[]
  currentUid?: string
  error?: string
  footer?: ReactNode
}

function FinalLeaderboard({ scores, currentUid, error, footer }: FinalLeaderboardProps) {
  const rankedScores = rankLiveScores(scores)
  const podiumScores = [rankedScores[1], rankedScores[0], rankedScores[2]].filter(
    (score): score is LiveScore => score !== undefined,
  )

  return (
    <main className="relative isolate flex min-h-screen min-h-[100svh] items-center justify-center overflow-hidden rounded-3xl bg-[#321064] px-4 py-10 text-white sm:px-7">
      <div className="pointer-events-none absolute -left-36 -top-56 size-[30rem] rounded-full bg-violet-300/10" />
      <div className="pointer-events-none absolute -right-36 -top-48 size-[28rem] rotate-45 bg-violet-200/[0.08]" />
      <div className="pointer-events-none absolute -bottom-48 -left-32 size-[34rem] bg-violet-300/[0.09]" />
      <div className="pointer-events-none absolute -bottom-64 -right-40 size-[34rem] rounded-full bg-violet-300/10" />

      <section aria-label="Final leaderboard" className="relative z-10 w-full max-w-5xl">
        <motion.header
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
          initial={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.45 }}
        >
          <div className="inline-flex items-center gap-2 text-sm font-black tracking-tight text-violet-100 sm:text-base">
            <Flag aria-hidden="true" size={18} />
            Capture the Flag!
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Leaderboard</h1>
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
            <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 items-center gap-3 sm:grid-cols-3 sm:gap-4">
              {podiumScores.map((score) => {
                const rank = rankedScores.indexOf(score) + 1
                const styles =
                  rank === 1
                    ? {
                      order: 'order-1 sm:order-2',
                        card: 'border-amber-200/25 bg-violet-950/45',
                      }
                    : rank === 2
                      ? {
                        order: 'order-2 sm:order-1',
                          card: 'border-white/10 bg-violet-950/30',
                        }
                      : {
                        order: 'order-3 sm:order-3',
                          card: 'border-white/10 bg-violet-950/30',
                        }

                return (
                  <motion.article
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex min-w-0 items-center gap-3 rounded-2xl border p-4 shadow-xl shadow-black/10 sm:gap-4 ${
                      rank === 1 ? 'sm:min-h-36 sm:scale-105' : 'sm:min-h-28'
                    } ${styles.order} ${styles.card}`}
                    initial={{ opacity: 0, y: 22, scale: 0.96 }}
                    key={score.uid}
                    transition={{ delay: (rank - 1) * 0.15, duration: 0.45, type: 'spring' }}
                  >
                    <span className="relative shrink-0">
                      <ParticipantAvatar avatarId={score.avatarId} size="lg" uid={score.uid} />
                      <span className="absolute -bottom-2 grid size-6 place-items-center rounded-full border border-white/40 bg-[#431782] text-xs font-black text-white">
                        {rank}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate text-base font-bold sm:text-lg">
                        {score.nickname}
                        {score.uid === currentUid && <span className="ml-1 text-xs text-violet-200">(You)</span>}
                      </span>
                      <span className="mt-1 block text-xs font-semibold text-violet-100/75 sm:text-sm">
                        {score.totalPoints.toLocaleString()} points
                      </span>
                    </span>
                  </motion.article>
                )
              })}
            </div>

            {rankedScores.length > 3 && (
              <ol className="mx-auto mt-7 max-w-md divide-y divide-white/20">
                {rankedScores.slice(3).map((score, index) => (
                  <motion.li
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center gap-3 py-2.5 text-sm sm:text-base ${
                      score.uid === currentUid ? 'font-bold text-white' : 'text-violet-100'
                    }`}
                    initial={{ opacity: 0, x: -8 }}
                    key={score.uid}
                    transition={{ delay: 0.45 + index * 0.06, duration: 0.3 }}
                  >
                    <span className="w-8 shrink-0 tabular-nums">{index + 4}.</span>
                    <ParticipantAvatar avatarId={score.avatarId} size="sm" uid={score.uid} />
                    <span className="min-w-0 flex-1 truncate">
                      {score.nickname}
                      {score.uid === currentUid && <span className="ml-2 text-xs text-violet-200">(You)</span>}
                    </span>
                    <span className="shrink-0 tabular-nums">{score.totalPoints.toLocaleString()}</span>
                  </motion.li>
                ))}
              </ol>
            )}
          </>
        )}

        {footer && <div className="mt-8 flex justify-center">{footer}</div>}
      </section>
    </main>
  )
}

export default FinalLeaderboard
