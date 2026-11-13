import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, ImagePlus, LoaderCircle, Plus, Save, Trash2 } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { createEmptyQuestion, type QuizInput, type QuizQuestion } from '../types/quiz'
import { createQuiz, getQuiz, getQuizErrorMessage, updateQuiz } from '../services/quizService'

function QuizEditor() {
  const { quizId } = useParams()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<QuizQuestion[]>([createEmptyQuestion()])
  const [loadingQuiz, setLoadingQuiz] = useState(Boolean(quizId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    if (!quizId || !user) {
      return
    }

    getQuiz(quizId)
      .then((quiz) => {
        if (!active) return
        if (!quiz) {
          setError('Quiz not found.')
          return
        }
        if (quiz.hostId !== user.uid) {
          setError('You do not have permission to edit this quiz.')
          return
        }
        setTitle(quiz.title)
        setDescription(quiz.description)
        setQuestions(quiz.questions)
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

  if (authLoading) {
    return <EditorLoading label="Checking your host account…" />
  }
  if (!user) {
    return <Navigate replace to="/host/login" />
  }

  function updateQuestion(index: number, patch: Partial<QuizQuestion>) {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...patch } : question,
      ),
    )
  }

  function updateOption(questionIndex: number, optionIndex: number, value: string) {
    setQuestions((current) =>
      current.map((question, currentIndex) => {
        if (currentIndex !== questionIndex) return question
        const options = [...question.options] as QuizQuestion['options']
        options[optionIndex] = value
        return { ...question, options }
      }),
    )
  }

  function addQuestion() {
    setQuestions((current) => [...current, createEmptyQuestion()])
    setError('')
  }

  function removeQuestion(index: number) {
    setQuestions((current) => current.filter((_, questionIndex) => questionIndex !== index))
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!user) return

    const trimmedTitle = title.trim()
    const trimmedDescription = description.trim()
    const normalizedQuestions = questions.map((question) => ({
      ...question,
      prompt: question.prompt.trim(),
      options: question.options.map((option) => option.trim()) as QuizQuestion['options'],
      imageUrl: question.imageUrl.trim(),
    }))

    if (trimmedTitle.length < 3) {
      setError('Quiz title must contain at least 3 characters.')
      return
    }
    if (questions.length === 0) {
      setError('Add at least one question before saving.')
      return
    }
    const incompleteQuestion = normalizedQuestions.findIndex(
      (question) =>
        question.prompt.length < 3 ||
        question.options.some((option) => option.length === 0),
    )
    if (incompleteQuestion >= 0) {
      setError(`Complete the question and all four answer options in Question ${incompleteQuestion + 1}.`)
      return
    }
    const invalidPointsIndex = normalizedQuestions.findIndex(
      (question) => !Number.isInteger(question.points) || question.points < 100 || question.points > 5000,
    )
    if (invalidPointsIndex >= 0) {
      setError(`Choose between 100 and 5,000 points for Question ${invalidPointsIndex + 1}.`)
      return
    }

    const input: QuizInput = {
      hostId: user.uid,
      title: trimmedTitle,
      description: trimmedDescription,
      questions: normalizedQuestions,
    }

    setSaving(true)
    try {
      let savedId: string
      if (quizId) {
        await updateQuiz(quizId, input)
        savedId = quizId
      } else {
        savedId = await createQuiz(input)
      }
      navigate(`/host/quizzes/${savedId}/preview`, { replace: true })
    } catch (saveError) {
      setError(getQuizErrorMessage(saveError))
    } finally {
      setSaving(false)
    }
  }

  if (loadingQuiz) {
    return <EditorLoading label="Loading your quiz…" />
  }

  if (quizId && error && (error === 'Quiz not found.' || error.includes('permission'))) {
    return (
      <section>
        <p className="rounded-xl border border-rose-300/20 bg-rose-300/[0.08] p-4 text-rose-200" role="alert">
          {error}
        </p>
        <Link className="mt-5 inline-flex items-center gap-2 text-sm text-violet-300" to="/host/dashboard">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
      </section>
    )
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

      <div className="mt-6">
        <p className="text-xs font-bold tracking-[0.18em] text-violet-300 uppercase">
          Quiz builder
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
          {quizId ? 'Edit your quiz' : 'Create a quiz'}
        </h1>
        <p className="mt-3 text-slate-400">
          Add your questions, four choices, a correct answer, and a timer for each.
        </p>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-rose-300/20 bg-rose-300/[0.08] p-4 text-sm text-rose-200" role="alert">
          {error}
        </div>
      )}

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-2xl border border-white/10 bg-[#11172a] p-5 sm:p-6">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold">Quiz title</span>
            <input
              className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-violet-400/60"
              maxLength={100}
              minLength={3}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Science Showdown"
              required
              value={title}
            />
          </label>
          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-semibold">Description <span className="font-normal text-slate-500">(optional)</span></span>
            <textarea
              className="min-h-24 w-full resize-y rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-600 focus:border-violet-400/60"
              maxLength={500}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is this quiz about?"
              value={description}
            />
          </label>
        </div>

        {questions.map((question, questionIndex) => (
          <fieldset
            className="min-w-0 rounded-2xl border border-white/10 bg-[#11172a] p-5 sm:p-6"
            key={questionIndex}
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <legend className="text-lg font-bold">
                Question {questionIndex + 1}
              </legend>
              {questions.length > 1 && (
                <button
                  aria-label={`Remove question ${questionIndex + 1}`}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-300/10"
                  onClick={() => removeQuestion(questionIndex)}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={15} />
                  Remove
                </button>
              )}
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-300">Question text</span>
              <textarea
                className="min-h-20 w-full resize-y rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-slate-600 focus:border-violet-400/60"
                maxLength={300}
                minLength={3}
                onChange={(event) => updateQuestion(questionIndex, { prompt: event.target.value })}
                placeholder="Type your question"
                required
                value={question.prompt}
              />
            </label>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {question.options.map((option, optionIndex) => (
                <label className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-[#0b1020] px-3.5 py-3 focus-within:border-violet-400/60" key={optionIndex}>
                  <input
                    aria-label={`Mark option ${optionIndex + 1} as correct`}
                    checked={question.correctIndex === optionIndex}
                    className="size-4 accent-violet-400"
                    name={`correct-answer-${questionIndex}`}
                    onChange={() => updateQuestion(questionIndex, { correctIndex: optionIndex })}
                    title="Select as correct answer"
                    type="radio"
                  />
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white/[0.07] text-xs font-bold text-slate-300">
                    {String.fromCharCode(65 + optionIndex)}
                  </span>
                  <input
                    aria-label={`Question ${questionIndex + 1}, option ${optionIndex + 1}`}
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-600"
                    maxLength={160}
                    onChange={(event) => updateOption(questionIndex, optionIndex, event.target.value)}
                    placeholder={`Answer option ${optionIndex + 1}`}
                    required
                    value={option}
                  />
                  {question.correctIndex === optionIndex && (
                    <span className="text-[10px] font-bold text-emerald-300">CORRECT</span>
                  )}
                </label>
              ))}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Time limit</span>
                <select
                  className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm outline-none focus:border-violet-400/60"
                  onChange={(event) => updateQuestion(questionIndex, { timeLimit: Number(event.target.value) })}
                  value={question.timeLimit}
                >
                  {[5, 10, 15, 20, 30, 45, 60, 90, 120].map((seconds) => (
                    <option key={seconds} value={seconds}>{seconds} seconds</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Points for a correct answer</span>
                <input
                  className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm outline-none focus:border-violet-400/60"
                  max={5000}
                  min={100}
                  onChange={(event) => updateQuestion(questionIndex, { points: Number(event.target.value) })}
                  required
                  step={100}
                  type="number"
                  value={question.points}
                />
                <span className="mt-1.5 block text-xs text-slate-500">100–5,000 base points; faster correct answers earn more.</span>
              </label>
              <label className="block">
                <span className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-slate-300">
                  <ImagePlus aria-hidden="true" size={15} /> Question image URL <span className="text-slate-500">(optional)</span>
                </span>
                <input
                  className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-violet-400/60"
                  onChange={(event) => updateQuestion(questionIndex, { imageUrl: event.target.value })}
                  placeholder="https://example.com/image.jpg"
                  type="url"
                  value={question.imageUrl}
                />
              </label>
            </div>
            {question.imageUrl && (
              <img
                alt="Question preview"
                className="mt-4 max-h-56 rounded-xl border border-white/10 object-contain"
                onError={(event) => {
                  event.currentTarget.hidden = true
                }}
                onLoad={(event) => {
                  event.currentTarget.hidden = false
                }}
                src={question.imageUrl}
              />
            )}
          </fieldset>
        ))}

        {questions.length < 50 && (
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-violet-300/30 bg-violet-300/[0.04] px-5 py-4 text-sm font-semibold text-violet-200 transition hover:border-violet-300/60 hover:bg-violet-300/[0.08]"
            onClick={addQuestion}
            type="button"
          >
            <Plus aria-hidden="true" size={17} />
            Add question
          </button>
        )}

        <div className="flex flex-col-reverse justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <Link
            className="inline-flex items-center justify-center rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5"
            to="/host/dashboard"
          >
            Cancel
          </Link>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={saving}
            type="submit"
          >
            {saving ? <LoaderCircle aria-hidden="true" className="animate-spin" size={17} /> : <Save aria-hidden="true" size={17} />}
            {saving ? 'Saving quiz…' : 'Save quiz'}
          </button>
        </div>
      </form>
    </section>
  )
}

function EditorLoading({ label }: { label: string }) {
  return (
    <div className="grid min-h-64 place-items-center text-sm text-slate-300">
      <span className="inline-flex items-center gap-3">
        <LoaderCircle aria-hidden="true" className="animate-spin text-violet-300" size={20} />
        {label}
      </span>
    </div>
  )
}

export default QuizEditor
