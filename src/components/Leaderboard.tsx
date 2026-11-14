import { motion } from 'framer-motion'
import { Crown, Medal, Trophy } from 'lucide-react'
import { rankLiveScores } from '../utils/leaderboard'
import type { LiveScore } from '../types/game'

interface LeaderboardProps {
  scores: LiveScore[]
  currentUid?: string
  title?: string
  variant?: 'live' | 'podium'
}

function Leaderboard({
  scores,
  currentUid,
  title = 'Live leaderboard',
  variant = 'live',
}: LeaderboardProps) {
  const rankedScores = rankLiveScores(scores)
  const podiumScores = [rankedScores[1], rankedScores[0], rankedScores[2]].filter(
    (score): score is LiveScore => score !== undefined,
  )

  return (
    <section aria-label={title} className="rounded-3xl border border-white/10 bg-[#11172a] p-5 sm:p-6">
      <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
        <span className="grid size-10 place-items-center rounded-xl bg-amber-300/10 text-amber-200">
          <Trophy aria-hidden="true" size={19} />
        </span>
        <div>
          <h2 className="font-bold">{title}</h2>
          <p className="mt-1 text-xs text-slate-400">Rankings update after each question</p>
        </div>
      </div>
      {rankedScores.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">
          {variant === 'podium' ? 'Final results are being prepared.' : 'Scores will appear after the first question.'}
        </p>
      ) : variant === 'podium' ? (
        <>
          <div className="mt-8 grid grid-cols-3 items-end gap-2 sm:gap-4">
            {podiumScores.map((score) => {
              const rank = rankedScores.indexOf(score) + 1
              const isWinner = rank === 1
              const rankStyle =
                rank === 1
                  ? 'border-amber-300/30 bg-gradient-to-b from-amber-300/20 to-amber-300/[0.04] text-amber-100'
                  : rank === 2
                    ? 'border-slate-300/20 bg-gradient-to-b from-slate-300/15 to-slate-300/[0.03] text-slate-100'
                    : 'border-orange-300/20 bg-gradient-to-b from-orange-300/15 to-orange-300/[0.03] text-orange-100'

              return (
                <motion.div
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex min-w-0 flex-col items-center rounded-2xl border px-2 py-4 text-center sm:px-4 ${
                    isWinner ? 'min-h-48 sm:min-h-56' : 'min-h-40 sm:min-h-48'
                  } ${rankStyle}`}
                  initial={{ opacity: 0, y: 36, scale: 0.9 }}
                  key={score.uid}
                  transition={{ delay: (rank - 1) * 0.2, duration: 0.55, type: 'spring', bounce: 0.35 }}
                >
                  {isWinner ? (
                    <Crown aria-hidden="true" className="mb-2 text-amber-200" size={24} />
                  ) : (
                    <Medal aria-hidden="true" className="mb-2 opacity-80" size={21} />
                  )}
                  <span className="text-2xl font-black sm:text-3xl">#{rank}</span>
                  <span className="mt-2 w-full truncate text-xs font-bold sm:text-sm">
                    {score.nickname}
                    {score.uid === currentUid && <span className="block text-[10px] opacity-70">You</span>}
                  </span>
                  <span className="mt-auto pt-3 text-xs font-black tabular-nums sm:text-sm">
                    {score.totalPoints.toLocaleString()} pts
                  </span>
                </motion.div>
              )
            })}
          </div>
          {rankedScores.length > 3 && (
            <ol className="mt-5 divide-y divide-white/[0.06] border-t border-white/[0.08]">
              {rankedScores.slice(3).map((score, index) => (
                <motion.li
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 py-3 text-slate-200"
                  initial={{ opacity: 0, y: 8 }}
                  key={score.uid}
                  transition={{ delay: 0.6 + index * 0.06, duration: 0.3 }}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-xs font-black text-slate-400">
                    {index + 4}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {score.nickname}
                    {score.uid === currentUid && <span className="ml-2 text-xs text-violet-300">You</span>}
                  </span>
                  <span className="text-sm font-black tabular-nums">{score.totalPoints.toLocaleString()} pts</span>
                </motion.li>
              ))}
            </ol>
          )}
        </>
      ) : (
        <ol className="mt-2 divide-y divide-white/[0.06]">
          {rankedScores.map((score, index) => (
            <motion.li
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-3 py-3 ${
                score.uid === currentUid ? 'text-violet-100' : 'text-slate-200'
              }`}
              initial={{ opacity: 0, y: 8 }}
              key={score.uid}
              layout
              transition={{ delay: index * 0.06, duration: 0.35, type: 'spring', bounce: 0.2 }}
            >
              <span className={`grid size-8 shrink-0 place-items-center rounded-lg text-xs font-black ${
                index === 0
                  ? 'bg-amber-300/15 text-amber-200'
                  : 'bg-white/[0.06] text-slate-400'
              }`}>
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {score.nickname}
                {score.uid === currentUid && <span className="ml-2 text-xs text-violet-300">You</span>}
              </span>
              <span className="text-sm font-black tabular-nums">{score.totalPoints.toLocaleString()} pts</span>
            </motion.li>
          ))}
        </ol>
      )}
    </section>
  )
}

export default Leaderboard
