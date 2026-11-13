import { useEffect, useState } from 'react'
import { AlertCircle, BookOpen, Clock3, Eye, LoaderCircle, Pencil, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { Quiz } from '../types/quiz'
import { deleteQuiz, getQuizErrorMessage, listHostQuizzes } from '../services/quizService'

function HostDashboard() {
  const { user } = useAuth()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    let active = true
    if (!user) return

    listHostQuizzes(user.uid)
      .then((items) => {
        if (active) {
          setQuizzes(items)
          setError('')
        }
      })
      .catch((loadError: unknown) => {
        if (active) setError(getQuizErrorMessage(loadError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [user, reloadCount])

  async function handleDelete(quiz: Quiz) {
    const confirmed = window.confirm(`Delete "${quiz.title}"? This cannot be undone.`)
    if (!confirmed) return
    setError('')
    setDeletingId(quiz.id)
    try {
      await deleteQuiz(quiz.id)
      setQuizzes((current) => current.filter((item) => item.id !== quiz.id))
    } catch (deleteError) {
      setError(getQuizErrorMessage(deleteError))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="pb-12">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-bold tracking-[0.18em] text-violet-300 uppercase">
            Host dashboard
          </span>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Your quizzes</h1>
          <p className="mt-3 text-slate-400">Create and manage the quizzes you bring to the arena.</p>
        </div>
        <Link
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-400"
          to="/host/quizzes/new"
        >
          <Plus aria-hidden="true" size={18} />
          Create quiz
        </Link>
      </div>

      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-rose-300/20 bg-rose-300/[0.08] p-4 text-sm text-rose-200" role="alert">
          <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0" size={17} />
          <div className="flex-1">
            <p>{error}</p>
            <button
              className="mt-2 font-semibold underline underline-offset-2"
              onClick={() => setReloadCount((count) => count + 1)}
              type="button"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <div className="mt-8">
        {loading ? (
          <div className="grid min-h-56 place-items-center rounded-2xl border border-white/[0.08] bg-[#11172a] text-sm text-slate-300">
            <span className="inline-flex items-center gap-3">
              <LoaderCircle aria-hidden="true" className="animate-spin text-violet-300" size={20} />
              Loading your quizzes…
            </span>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-[#11172a]/70 px-6 py-14 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-violet-400/10 text-violet-200">
              <BookOpen aria-hidden="true" size={23} />
            </span>
            <h2 className="mt-5 text-lg font-bold">Your quiz library is empty</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
              Start with a title and a question. You can edit your quiz any time before hosting.
            </p>
            <Link
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-400"
              to="/host/quizzes/new"
            >
              <Plus aria-hidden="true" size={17} />
              Create your first quiz
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {quizzes.map((quiz) => (
              <article className="rounded-2xl border border-white/[0.08] bg-[#11172a] p-5 sm:p-6" key={quiz.id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="break-words text-lg font-bold">{quiz.title}</h2>
                    <p className="mt-2 line-clamp-2 min-h-6 text-sm leading-6 text-slate-400">
                      {quiz.description || 'No description'}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-emerald-300/15 bg-emerald-300/[0.07] px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                    Draft
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.07] pt-4 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen aria-hidden="true" size={14} /> {quiz.questions.length} questions
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 aria-hidden="true" size={14} /> Edited {new Date(quiz.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    className="inline-flex items-center gap-2 rounded-lg bg-violet-500/15 px-3 py-2 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/25"
                    to={`/host/quizzes/${quiz.id}/preview`}
                  >
                    <Eye aria-hidden="true" size={14} /> Preview
                  </Link>
                  <Link
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/5"
                    to={`/host/quizzes/${quiz.id}/edit`}
                  >
                    <Pencil aria-hidden="true" size={14} /> Edit
                  </Link>
                  <button
                    className="inline-flex items-center gap-2 rounded-lg border border-rose-300/15 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-300/10 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={deletingId === quiz.id}
                    onClick={() => void handleDelete(quiz)}
                    type="button"
                  >
                    {deletingId === quiz.id ? (
                      <LoaderCircle aria-hidden="true" className="animate-spin" size={14} />
                    ) : (
                      <Trash2 aria-hidden="true" size={14} />
                    )}
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default HostDashboard
