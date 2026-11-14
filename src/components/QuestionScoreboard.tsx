import { useEffect, type ReactNode } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { ArrowDown, ArrowUp, Minus, Trophy } from 'lucide-react'
import ParticipantAvatar from './ParticipantAvatar'
import { rankLiveScores } from '../utils/leaderboard'
import type { LiveScore } from '../types/game'

interface QuestionScoreboardProps {
  questionNumber: number
  scores: LiveScore[]
  action: ReactNode
}

interface AnimatedScoreProps {
  from: number
  to: number
}

function AnimatedScore({ from, to }: AnimatedScoreProps) {
  const score = useMotionValue(from)
  const formattedScore = useTransform(score, (value) => Math.round(value).toLocaleString())

  useEffect(() => {
    const controls = animate(score, to, { duration: 0.9, ease: 'easeOut' })
    return () => controls.stop()
  }, [score, to])

  return <motion.span>{formattedScore}</motion.span>
}

function QuestionScoreboard({ questionNumber, scores, action }: QuestionScoreboardProps) {
  const rankedScores = rankLiveScores(scores)
  const previousRanks = new Map(
    rankLiveScores(
      scores.map((score) => ({
        ...score,
        totalPoints: Math.max(0, score.totalPoints - score.lastQuestionPoints),
      })),
    ).map((score, index) => [score.uid, index + 1]),
  )

  return (
    <section
      aria-label={`Scoreboard after question ${questionNumber}`}
      className="relative isolate overflow-hidden rounded-3xl border border-violet-300/20 bg-gradient-to-br from-[#351273] via-[#29105e] to-[#160d2c] p-4 shadow-2xl shadow-violet-950/30 sm:p-7"
    >
      <div className="pointer-events-none absolute -right-20 -top-28 size-72 rounded-full bg-violet-300/10 blur-3xl" />
      <div className="relative grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <p className="order-2 text-center text-xs font-bold tracking-[0.18em] text-violet-200 uppercase sm:order-none sm:text-left">
          Question {questionNumber} complete
        </p>
        <h2 className="order-1 inline-flex items-center justify-center gap-2 text-2xl font-black tracking-tight sm:order-none sm:text-3xl">
          <Trophy aria-hidden="true" className="text-amber-200" size={23} />
          Scoreboard
        </h2>
        <div className="order-3 flex justify-center sm:justify-end">{action}</div>
      </div>

      {rankedScores.length === 0 ? (
        <p className="relative py-12 text-center text-sm text-violet-100/80" role="status">
          Waiting for scores…
        </p>
      ) : (
        <ol aria-label="Player standings" className="relative mt-6 space-y-2 sm:mt-8">
          {rankedScores.map((score, index) => {
            const rank = index + 1
            const previousRank = previousRanks.get(score.uid) ?? rank
            const rankChange = previousRank - rank
            const isLeader = rank === 1
            const pointsThisQuestion = score.lastQuestionPoints

            return (
              <motion.li
                animate={{ opacity: 1, y: 0 }}
                className={`flex min-h-[76px] items-center gap-3 rounded-xl border px-3 py-3 shadow-lg shadow-black/10 sm:gap-4 sm:px-5 ${
                  isLeader
                    ? 'border-white/80 bg-white text-slate-900'
                    : 'border-violet-200/10 bg-[#4b1990] text-white'
                }`}
                initial={{ opacity: 0.55, y: (previousRank - rank) * 76 }}
                key={score.uid}
                layout
                transition={{
                  delay: index * 0.07,
                  duration: 0.75,
                  type: 'spring',
                  stiffness: 140,
                  damping: 20,
                }}
              >
                <span
                  aria-label={`Rank ${rank}`}
                  className={`grid size-9 shrink-0 place-items-center rounded-lg text-sm font-black tabular-nums sm:size-11 ${
                    isLeader ? 'bg-amber-100 text-amber-800' : 'bg-white/10 text-violet-100'
                  }`}
                >
                  {rank}
                </span>
                <ParticipantAvatar
                  avatarId={score.avatarId}
                  size="md"
                  uid={score.uid}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-bold sm:text-lg">{score.nickname}</span>
                  <span
                    className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${
                      isLeader ? 'text-emerald-700' : 'text-violet-100/80'
                    }`}
                  >
                    {rankChange > 0 ? (
                      <>
                        <ArrowUp aria-hidden="true" size={13} />
                        Up {rankChange} {rankChange === 1 ? 'place' : 'places'}
                      </>
                    ) : rankChange < 0 ? (
                      <>
                        <ArrowDown aria-hidden="true" size={13} />
                        Down {Math.abs(rankChange)} {Math.abs(rankChange) === 1 ? 'place' : 'places'}
                      </>
                    ) : (
                      <>
                        <Minus aria-hidden="true" size={13} />
                        No rank change
                      </>
                    )}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-lg font-black tabular-nums sm:text-xl">
                    <AnimatedScore
                      from={Math.max(0, score.totalPoints - pointsThisQuestion)}
                      to={score.totalPoints}
                    />
                  </span>
                  <span className={`mt-1 block text-xs font-bold tabular-nums ${
                    isLeader ? 'text-emerald-700' : 'text-emerald-200'
                  }`}>
                    +{pointsThisQuestion.toLocaleString()} this question
                  </span>
                </span>
              </motion.li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

export default QuestionScoreboard
