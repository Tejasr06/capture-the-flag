import { useEffect } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { Check, ChartNoAxesColumnIncreasing } from 'lucide-react'
import type { LiveQuestion } from '../types/game'

interface AnswerDistributionProps {
  question: LiveQuestion
  questionNumber: number
  answers: Record<string, number>
  correctIndex: number
}

function AnimatedCount({ count }: { count: number }) {
  const value = useMotionValue(0)
  const displayedValue = useTransform(value, (current) => Math.round(current).toLocaleString())

  useEffect(() => {
    const controls = animate(value, count, { delay: 0.35, duration: 1.4, ease: 'easeOut' })
    return () => controls.stop()
  }, [count, value])

  return <motion.span>{displayedValue}</motion.span>
}

function AnswerDistribution({
  question,
  questionNumber,
  answers,
  correctIndex,
}: AnswerDistributionProps) {
  const answerCounts = question.options.map(
    (_, optionIndex) => Object.values(answers).filter((answer) => answer === optionIndex).length,
  )
  const maxCount = Math.max(0, ...answerCounts)
  const totalAnswers = answerCounts.reduce((total, count) => total + count, 0)

  return (
    <section
      aria-label={`Answer distribution after question ${questionNumber}`}
      className="overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-100 via-blue-50 to-white p-4 text-slate-900 shadow-2xl shadow-sky-950/25 sm:p-7"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black tracking-[0.16em] text-sky-800 uppercase">
            Question {questionNumber} complete
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-black sm:text-2xl">
            <ChartNoAxesColumnIncreasing aria-hidden="true" className="text-sky-700" size={23} />
            Answer distribution
          </h2>
        </div>
        <p className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
          <AnimatedCount count={totalAnswers} /> responses
        </p>
      </header>

      <ol aria-label="Answer counts" className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
        {question.options.map((option, index) => {
          const count = answerCounts[index]
          const isCorrect = index === correctIndex
          const barHeight = count === 0 || maxCount === 0 ? 0 : Math.max(34, (count / maxCount) * 176)

          return (
            <li
              aria-label={`${option}: ${count} ${count === 1 ? 'response' : 'responses'}${isCorrect ? ', correct answer' : ''}`}
              className="min-w-0"
              key={index}
            >
              <div className="relative mx-auto flex h-56 max-w-40 items-end justify-center border-b-[3px] border-sky-400/70 px-2">
                <motion.div
                  animate={{ height: barHeight }}
                  className={`absolute bottom-0 left-1/2 w-[78%] -translate-x-1/2 rounded-t-2xl shadow-lg ${
                    isCorrect
                      ? 'bg-gradient-to-t from-emerald-600 to-lime-400 shadow-emerald-700/20'
                      : 'bg-gradient-to-t from-rose-600 to-red-400 shadow-rose-700/20'
                  }`}
                  initial={{ height: 0 }}
                  transition={{ delay: 0.25, duration: 1.5, ease: 'easeOut' }}
                />
                <motion.span
                  animate={{ y: -barHeight }}
                  className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 rounded-xl bg-white px-3 py-1.5 text-2xl font-black tabular-nums text-slate-900 shadow-md"
                  initial={{ y: 0 }}
                  transition={{ delay: 0.25, duration: 1.5, ease: 'easeOut' }}
                >
                  <AnimatedCount count={count} />
                </motion.span>
              </div>
              <div className="mt-3 flex min-h-14 flex-col items-center justify-start gap-1 rounded-xl bg-white/80 px-2 py-2 text-center shadow-sm">
                <span className="line-clamp-2 text-xs font-bold leading-4 text-slate-800 sm:text-sm">
                  {option}
                </span>
                {isCorrect && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-wide text-emerald-700 uppercase">
                    <Check aria-hidden="true" size={12} />
                    Correct
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default AnswerDistribution
