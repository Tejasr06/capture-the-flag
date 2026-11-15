import { useEffect, useState } from 'react'
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
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(true)
  const answerCounts = question.options.map(
    (_, optionIndex) => Object.values(answers).filter((answer) => answer === optionIndex).length,
  )
  const maxCount = Math.max(0, ...answerCounts)
  const totalAnswers = answerCounts.reduce((total, count) => total + count, 0)

  return (
    <section
      aria-label={`Answer distribution after question ${questionNumber}`}
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 text-slate-900 shadow-lg shadow-slate-200/50 sm:p-6"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black tracking-[0.18em] text-slate-500 uppercase">
            Question {questionNumber} complete
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-xl font-black sm:text-2xl">
            <ChartNoAxesColumnIncreasing aria-hidden="true" className="text-slate-700" size={22} />
            Answer distribution
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
            onClick={() => setShowCorrectAnswer((current) => !current)}
            type="button"
          >
            {showCorrectAnswer ? 'Hide correct answer' : 'Show correct answer'}
          </button>
          <p className="rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700">
            <AnimatedCount count={totalAnswers} /> responses
          </p>
        </div>
      </header>

      {showCorrectAnswer && (
        <div className="mt-4 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-sm font-bold text-emerald-700">
            <Check aria-hidden="true" size={16} />
            Correct answer: {String.fromCharCode(65 + correctIndex)}. {question.options[correctIndex]}
          </div>
        </div>
      )}

      <ol aria-label="Answer counts" className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
        {question.options.map((option, index) => {
          const count = answerCounts[index]
          const isCorrect = index === correctIndex
          const barHeight = count === 0 || maxCount === 0 ? 0 : Math.max(18, (count / maxCount) * 170)
          const barBackground = showCorrectAnswer
            ? isCorrect
              ? 'bg-emerald-500'
              : 'bg-rose-400'
            : 'bg-slate-200'

          return (
            <li
              aria-label={`${option}: ${count} ${count === 1 ? 'response' : 'responses'}${isCorrect ? ', correct answer' : ''}`}
              className="min-w-0"
              key={index}
            >
              <div className="mx-auto flex h-40 max-w-40 flex-col items-center justify-end gap-2 border-b border-slate-200 px-2 pb-1">
                <motion.span
                  animate={{ height: barHeight }}
                  className={`w-full max-w-[92px] rounded-t-xl ${barBackground}`}
                  initial={{ height: 0 }}
                  transition={{ delay: 0.2, duration: 1.2, ease: 'easeOut' }}
                />
                <span className="text-lg font-black tabular-nums text-slate-800">
                  <AnimatedCount count={count} />
                </span>
              </div>

              <div className="mt-3 flex min-h-16 flex-col items-center justify-start gap-1 rounded-xl bg-slate-50 px-2 py-2 text-center">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="line-clamp-2 text-xs font-semibold leading-4 text-slate-800 sm:text-sm">
                  {option}
                </span>
                {showCorrectAnswer && isCorrect && (
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
