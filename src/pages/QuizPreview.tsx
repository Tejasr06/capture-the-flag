import { useEffect, useState } from 'react'
import { ArrowLeft, CircleCheck, Clock3, LoaderCircle, Pencil, Play, Sparkles } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { Quiz } from '../types/quiz'
import { getQuiz, getQuizErrorMessage } from '../services/quizService'
import { createLiveGame, getLiveGameErrorMessage } from '../services/gameService'

function QuizPreview() {
  const { quizId } = useParams()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loadingQuiz, setLoadingQuiz] = useState(true)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    let active = true
    if (!quizId || !user) {
      return
    }

    getQuiz(quizId)
      .then((result) => {
        if (!active) return
        if (!result) {
          setError('Quiz not found.')
        } else if (result.hostId !== user.uid) {
          setError('You do not have permission to preview this quiz.')
        } else {
          setQuiz(result)
        }
      })
      .catch((loadError: unknown) => {
        if (active) setError(getQuizErrorMessage(loadError))
      })
      .finally(() => {
        if (active) setLoadingQuiz(false)
      })

    return () => {
      active = false
    }
  }, [quizId, user])

  if (authLoading) return <Loading label="Checking your host account…" />
  if (!user) return <Navigate replace to="/host/login" />
  if (loadingQuiz) return <Loading label="Loading quiz preview…" />

  if (!quiz) {
    return (
      <section>
        <p className="rounded-xl border border-rose-300/20 bg-rose-300/[0.08] p-4 text-rose-200" role="alert">
          {error || 'Quiz not found.'}
        </p>
        <Link className="mt-5 inline-flex items-center gap-2 text-sm text-violet-300" to="/host/dashboard">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
      </section>
    )
  }

  async function handleStartLiveGame() {
    if (!user || !quiz) return
    setError('')
    setStarting(true)
    try {
      const pin = await createLiveGame(quiz.id, user.uid)
      navigate(`/host/games/${pin}`)
    } catch (startError) {
      setError(getLiveGameErrorMessage(startError))
    } finally {
      setStarting(false)
    }
  }

  return (
    <section className="mx-auto max-w-4xl pb-12">
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
        to="/host/dashboard"
      >
        <ArrowLeft aria-hidden="true" size={16} />
        Back to dashboard
      </Link>
      {error && (
        <p className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/[0.08] p-4 text-sm text-rose-200" role="alert">
          {error}
        </p>
      )}
      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-violet-300 uppercase">
            <Sparkles aria-hidden="true" size={14} /> Quiz preview
          </span>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{quiz.title}</h1>
          {quiz.description && <p className="mt-3 max-w-2xl leading-7 text-slate-400">{quiz.description}</p>}
          <p className="mt-3 text-sm text-slate-500">
            {quiz.questions.length} {quiz.questions.length === 1 ? 'question' : 'questions'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
            to={`/host/quizzes/${quiz.id}/edit`}
          >
            <Pencil aria-hidden="true" size={16} /> Edit
          </Link>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={starting}
            onClick={() => void handleStartLiveGame()}
            type="button"
          >
            {starting ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />
            ) : (
              <Play aria-hidden="true" size={16} />
            )}
            {starting ? 'Creating game…' : 'Start live quiz'}
          </button>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {quiz.questions.map((question, index) => (
          <article className="rounded-2xl border border-white/10 bg-[#11172a] p-5 sm:p-6" key={`${quiz.id}-${index}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-bold text-violet-200">Question {index + 1}</span>
              <span className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1.5 text-xs text-slate-300">
                  <Clock3 aria-hidden="true" size={13} /> {question.timeLimit}s
                </span>
                <span className="rounded-full bg-amber-300/10 px-3 py-1.5 text-xs font-semibold text-amber-200">
                  Up to {question.points} points
                </span>
              </span>
            </div>
            <h2 className="mt-4 text-lg font-bold leading-7">{question.prompt}</h2>
            {question.imageUrl && (
              <img alt="" className="mt-4 max-h-72 rounded-xl border border-white/10 object-contain" src={question.imageUrl} />
            )}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {question.options.map((option, optionIndex) => {
                const isCorrect = optionIndex === question.correctIndex
                return (
                  <div
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                      isCorrect
                        ? 'border-emerald-300/30 bg-emerald-300/[0.08] text-emerald-100'
                        : 'border-white/[0.08] bg-[#0b1020] text-slate-200'
                    }`}
                    key={`${index}-${optionIndex}`}
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white/[0.07] text-xs font-bold">
                      {String.fromCharCode(65 + optionIndex)}
                    </span>
                    <span className="flex-1">{option}</span>
                    {isCorrect && <CircleCheck aria-label="Correct answer" className="text-emerald-300" size={17} />}
                  </div>
                )
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function Loading({ label }: { label: string }) {
  return (
    <div className="grid min-h-64 place-items-center text-sm text-slate-300">
      <span className="inline-flex items-center gap-3">
        <LoaderCircle aria-hidden="true" className="animate-spin text-violet-300" size={20} />
        {label}
      </span>
    </div>
  )
}

export default QuizPreview
