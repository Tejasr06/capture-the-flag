import { motion } from 'framer-motion'
import { Check, ChartNoAxesColumnIncreasing } from 'lucide-react'
import type { LiveQuestion } from '../types/game'

interface AnswerDistributionProps {
  question: LiveQuestion
  questionNumber: number
  answers: Record<string, number>
  correctIndex: number
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
      className="overflow-hidden rounded-3xl border border-sky-100 bg-sky-50 p-4 text-slate-900 sm:p-7"
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
        <p className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
          {totalAnswers} {totalAnswers === 1 ? 'response' : 'responses'}
        </p>
      </header>

      <ol
        aria-label="Answer counts"
        className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5"
      >
        {question.options.map((option, index) => {
          const count = answerCounts[index]
          const isCorrect = index === correctIndex
          const barHeight = count === 0 || maxCount === 0 ? 0 : Math.max(18, (count / maxCount) * 210)

          return (
            <li
              aria-label={`${option}: ${count} ${count === 1 ? 'response' : 'responses'}${isCorrect ? ', correct answer' : ''}`}
              className="min-w-0"
              key={index}
            >
              <div className="relative mx-auto flex h-64 max-w-48 items-end justify-center border-b-[3px] border-sky-400 px-2">
                <motion.span
                  aria-hidden="true"
                  className={`absolute bottom-0 w-[78%] max-w-40 rounded-t-sm ${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  animate={{ height: barHeight }}
                  initial={{ height: 0 }}
                  transition={{ delay: 0.2, duration: 1.2, ease: 'easeOut' }}
                />
                <motion.span
                  className="absolute left-1/2 z-10 -translate-x-1/2 rounded-xl bg-white px-3 py-1.5 text-2xl font-black tabular-nums text-slate-900 shadow-sm"
                  animate={{ bottom: barHeight + 8 }}
                  initial={{ bottom: 8 }}
                  transition={{ delay: 0.2, duration: 1.2, ease: 'easeOut' }}
                >
                  {count}
                </motion.span>
              </div>
              <div className="mt-3 flex min-h-16 flex-col items-center justify-start gap-1 rounded-xl bg-white px-2 py-2 text-center shadow-sm">
                <span className="text-xs font-black tracking-wide text-slate-500 uppercase">
                  {String.fromCharCode(65 + index)}
                </span>
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
