import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Copy, LoaderCircle, Radio, Users, Wifi } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import AnswerDistribution from '../components/AnswerDistribution'
import FinalLeaderboard from '../components/FinalLeaderboard'
import ParticipantAvatar from '../components/ParticipantAvatar'
import QuestionScoreboard from '../components/QuestionScoreboard'
import { useAuth } from '../hooks/useAuth'
import {
  ANSWER_DISTRIBUTION_DURATION_MS,
  QUESTION_READING_DURATION_MS,
} from '../utils/gameTiming'
import type { LiveGame, LiveScore } from '../types/game'
import {
  closeQuestion,
  endLiveGame,
  getLiveGameErrorMessage,
  publishQuestion,
  revealFinalLeaderboard,
  startNextQuestionCountdown,
  watchLiveGame,
  watchLiveScores,
  watchServerTime,
  watchSubmittedAnswers,
} from '../services/gameService'

function HostGame() {
  const { pin } = useParams()
  const { user, loading } = useAuth()
  const [game, setGame] = useState<LiveGame | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [serverTime, setServerTime] = useState(() => Date.now())
  const [serverTimeReady, setServerTimeReady] = useState(false)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [scores, setScores] = useState<LiveScore[]>([])
  const [working, setWorking] = useState(false)
  const [countdownRetry, setCountdownRetry] = useState(0)
  const [dismissedAnswerDistributionKey, setDismissedAnswerDistributionKey] = useState<string | null>(null)
  const closeStarted = useRef(false)
  const countdownStarted = useRef<string | null>(null)

  useEffect(() => {
    if (!pin || !user) return
    return watchLiveGame(
      pin,
      (nextGame) => {
        if (!nextGame) {
          setError('This game PIN does not exist.')
          return
        }
        if (nextGame.hostUid !== user.uid) {
          setError('You are not the host of this game.')
          return
        }
        setError('')
        setGame(nextGame)
      },
      (message) => setError(`Live game updates failed: ${message}`),
    )
  }, [pin, user])

  useEffect(
    () =>
      watchServerTime((time) => {
        setServerTime(time)
        setServerTimeReady(true)
      }),
    [],
  )

  useEffect(() => {
    if (!pin || !game || !user) return
    return watchLiveScores(
      pin,
      setScores,
      (message) => setError(`Live scores could not be read: ${message}`),
    )
  }, [game, pin, user])

  const participantIds = useMemo(
    () => Object.keys(game?.participants ?? {}).sort(),
    [game?.participants],
  )

  useEffect(() => {
    if (!pin || !game || !user || participantIds.length === 0) {
      return
    }
    return watchSubmittedAnswers(
      pin,
      participantIds,
      setAnswers,
      (message) => setError(`Participant answers could not be read: ${message}`),
    )
  }, [game, participantIds, pin, user])

  const participants = useMemo(
    () => Object.values(game?.participants ?? {}).sort((a, b) => a.joinedAt - b.joinedAt),
    [game?.participants],
  )
  const connectedParticipants = useMemo(
    () => participants.filter((participant) => participant.connected),
    [participants],
  )
  const question = game?.currentQuestion
  const answerReviewKey =
    game?.status === 'answerReview' && game.answerReveal && question && pin
      ? `${pin}:${question.index}:${question.startedAt}`
      : null
  useEffect(() => {
    if (!answerReviewKey) return
    const timeout = window.setTimeout(
      () => setDismissedAnswerDistributionKey(answerReviewKey),
      ANSWER_DISTRIBUTION_DURATION_MS,
    )
    return () => window.clearTimeout(timeout)
  }, [answerReviewKey])
  const showAnswerDistribution =
    answerReviewKey !== null && dismissedAnswerDistributionKey !== answerReviewKey
  const questionAnswerStartsAt = question
    ? question.startedAt + QUESTION_READING_DURATION_MS
    : 0
  const questionIsReading =
    question !== null &&
    question !== undefined &&
    (!serverTimeReady || serverTime < questionAnswerStartsAt)
  const questionReadSecondsRemaining = questionIsReading
    ? serverTimeReady
      ? Math.max(0, Math.ceil((questionAnswerStartsAt - serverTime) / 1000))
      : Math.ceil(QUESTION_READING_DURATION_MS / 1000)
    : 0
  const questionDeadline = question
    ? questionAnswerStartsAt + question.timeLimit * 1000
    : 0
  const secondsRemaining = question
    ? serverTimeReady
      ? Math.max(
          0,
          Math.ceil((questionDeadline - Math.max(serverTime, questionAnswerStartsAt)) / 1000),
        )
      : question.timeLimit
    : 0
  const nextQuestionSecondsRemaining =
    game?.countdownEndsAt !== undefined
      ? serverTimeReady
        ? Math.max(0, Math.ceil((game.countdownEndsAt - serverTime) / 1000))
        : 5
      : 0

  useEffect(() => {
    if (!game || !pin || !user || game.status !== 'question' || !question || secondsRemaining > 0) {
      return
    }
    if (closeStarted.current) return
    closeStarted.current = true
    setWorking(true)
    closeQuestion(pin, user.uid)
      .catch((closeError: unknown) =>
        setError(`Automatic question close failed: ${getLiveGameErrorMessage(closeError)}`),
      )
      .finally(() => {
        closeStarted.current = false
        setWorking(false)
      })
  }, [game, pin, question, secondsRemaining, user])

  useEffect(() => {
    if (!game || !pin || !user || game.status !== 'answerReview' || game.answerReveal) {
      return
    }
    if (closeStarted.current) return
    closeStarted.current = true
    closeQuestion(pin, user.uid)
      .catch((closeError: unknown) =>
        setError(`Automatic score calculation failed: ${getLiveGameErrorMessage(closeError)}`),
      )
      .finally(() => {
        closeStarted.current = false
      })
  }, [game, pin, user])

  useEffect(() => {
    if (
      !game ||
      !pin ||
      !user ||
      game.status !== 'countdown' ||
      !serverTimeReady ||
      typeof game.nextQuestionIndex !== 'number' ||
      game.countdownEndsAt === undefined ||
      nextQuestionSecondsRemaining > 0
    ) {
      return
    }

    const attemptKey = `${pin}:${game.countdownEndsAt}`
    if (countdownStarted.current === attemptKey) return
    countdownStarted.current = attemptKey
    setError('')
    setWorking(true)
    publishQuestion(pin, game.nextQuestionIndex)
      .catch((actionError: unknown) =>
        setError(`Starting the next question failed: ${getLiveGameErrorMessage(actionError)}`),
      )
      .finally(() => setWorking(false))
  }, [countdownRetry, game, nextQuestionSecondsRemaining, pin, serverTimeReady, user])

  if (loading) return <Loading label="Checking your host account…" />
  if (!user) return <Navigate replace to="/host/login" />
  if (!pin || !/^\d{6}$/.test(pin)) return <Navigate replace to="/host/dashboard" />

  async function copyJoinDetails() {
    setError('')
    try {
      await navigator.clipboard.writeText(`Join my QuizArena game!\nPIN: ${pin}\n${window.location.origin}/join`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch (copyError) {
      setError(`Copying join details failed: ${getLiveGameErrorMessage(copyError)}`)
    }
  }

  async function handleStartQuestion(index: number) {
    if (!pin || !user) return
    setError('')
    setWorking(true)
    try {
      await publishQuestion(pin, index)
    } catch (actionError) {
      setError(`Starting the question failed: ${getLiveGameErrorMessage(actionError)}`)
    } finally {
      setWorking(false)
    }
  }

  async function handleStartNextQuestion() {
    if (!pin || !user || !question) return
    setError('')
    setWorking(true)
    try {
      await startNextQuestionCountdown(pin, user.uid)
    } catch (actionError) {
      setError(`Starting the next-question countdown failed: ${getLiveGameErrorMessage(actionError)}`)
    } finally {
      setWorking(false)
    }
  }

  function handleRetryStartingQuestion() {
    countdownStarted.current = null
    setCountdownRetry((retry) => retry + 1)
  }

  async function handleCloseQuestion() {
    if (!pin || !user) return
    setError('')
    closeStarted.current = true
    setWorking(true)
    try {
      await closeQuestion(pin, user.uid)
    } catch (actionError) {
      setError(`Closing the question failed: ${getLiveGameErrorMessage(actionError)}`)
    } finally {
      closeStarted.current = false
      setWorking(false)
    }
  }

  async function handleEndGame() {
    if (!pin || !user) return
    setError('')
    setWorking(true)
    try {
      await endLiveGame(pin, user.uid)
    } catch (actionError) {
      setError(`Ending the game failed: ${getLiveGameErrorMessage(actionError)}`)
    } finally {
      setWorking(false)
    }
  }

  async function handleShowFinalLeaderboard() {
    if (!pin || !user) return
    setError('')
    setWorking(true)
    try {
      await revealFinalLeaderboard(pin, user.uid)
    } catch (actionError) {
      setError(`Showing the final leaderboard failed: ${getLiveGameErrorMessage(actionError)}`)
    } finally {
      setWorking(false)
    }
  }

  if (game?.status === 'leaderboard') {
    return (
      <FinalLeaderboard
        error={error}
        footer={
          <Link
            className="rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15"
            to="/host/dashboard"
          >
            Return to dashboard
          </Link>
        }
        scores={scores}
      />
    )
  }

  if (game?.status === 'lobby') {
    return (
      <main className="relative min-h-screen min-h-[100svh] overflow-hidden bg-[#dce8f7] px-4 py-5 text-slate-900 sm:px-8 sm:py-7">
        <img
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full object-cover"
          src="/winter-lobby-background.svg"
        />
        <div className="pointer-events-none absolute inset-0 bg-white/10" />

        <div className="relative mx-auto flex min-h-[calc(100svh-3.5rem)] w-full max-w-7xl flex-col">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <Link
              className="inline-flex items-center gap-2 rounded-xl border border-white/80 bg-white/60 px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-white"
              to="/host/dashboard"
            >
              <ArrowLeft aria-hidden="true" size={16} />
              Dashboard
            </Link>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-900/20 transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={working || connectedParticipants.length === 0}
              onClick={() => void handleStartQuestion(0)}
              type="button"
            >
              {working ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" size={17} />
              ) : (
                <Radio aria-hidden="true" size={17} />
              )}
              Start Question 1
            </button>
          </header>

          {error && (
            <div className="mt-5 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
              {error}
            </div>
          )}

          <section className="mx-auto mt-4 grid w-full max-w-4xl gap-4 rounded-2xl border border-white bg-white/95 p-4 shadow-xl shadow-slate-700/10 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:px-7 sm:py-5">
            <div className="text-center sm:text-left">
              <p className="text-xs font-bold tracking-wide text-slate-500">Join at</p>
              <p className="mt-1 break-all text-sm font-black text-slate-800">{window.location.host}/join</p>
              <p className="mt-1 text-xs text-slate-500">Enter this PIN to play</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-black tracking-[0.2em] text-slate-500 uppercase">Game PIN</p>
              <p aria-label={`Game PIN ${pin}`} className="mt-1 text-4xl font-black tracking-[0.16em] text-slate-900 sm:text-5xl">
                {pin}
              </p>
            </div>
            <div className="flex justify-center sm:justify-end">
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                onClick={() => void copyJoinDetails()}
                type="button"
              >
                {copied ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}
                {copied ? 'Copied' : 'Copy join details'}
              </button>
            </div>
          </section>

          <section className="mt-7 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-violet-900 px-4 py-2 text-sm font-black text-white shadow-lg shadow-violet-900/15">
              <Radio aria-hidden="true" size={16} />
              Capture the Flag!
            </span>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{game.title}</h1>
            <p className="mt-2 text-sm font-medium text-slate-600">
              Players will appear here as they join
            </p>
          </section>

          {connectedParticipants.length === 0 ? (
            <div className="mx-auto mt-8 grid min-h-48 w-full max-w-4xl flex-1 place-items-center rounded-3xl border-2 border-dashed border-sky-200 bg-white/50 text-center">
              <div>
                <Users aria-hidden="true" className="mx-auto text-slate-400" size={30} />
                <p className="mt-3 text-lg font-bold text-slate-700">Waiting for players to join</p>
                <p className="mt-1 text-sm text-slate-500">Share the PIN to invite your group.</p>
              </div>
            </div>
          ) : (
            <ul aria-label="Connected players" className="mx-auto mt-7 grid w-full max-w-6xl flex-1 content-start grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {connectedParticipants.map((participant, index) => (
                <motion.li
                  animate={{ opacity: 1, y: 0 }}
                  className="flex min-w-0 items-center gap-3 rounded-xl border border-white/90 bg-white/90 p-3 shadow-md shadow-slate-700/10 sm:min-h-24"
                  initial={{ opacity: 0, y: 12 }}
                  key={participant.uid}
                  layout
                  transition={{ delay: index * 0.04, duration: 0.3 }}
                >
                  <ParticipantAvatar
                    avatarId={participant.avatarId}
                    size="lg"
                    uid={participant.uid}
                  />
                  <span className="min-w-0 flex-1 truncate text-base font-black text-slate-800">
                    {participant.nickname}
                  </span>
                  <Wifi aria-label="Connected" className="shrink-0 text-emerald-600" size={16} />
                </motion.li>
              ))}
            </ul>
          )}

          <footer className="mt-7 flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-violet-950 px-5 py-4 text-center text-white shadow-xl shadow-violet-950/15">
            <Users aria-hidden="true" size={19} />
            <span aria-live="polite" className="text-base font-black">
              {connectedParticipants.length} {connectedParticipants.length === 1 ? 'player' : 'players'} joined
            </span>
            <span className="hidden text-sm text-violet-200 sm:inline">·</span>
            <span className="text-sm font-semibold text-violet-100">Live lobby</span>
          </footer>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0b1020] px-5 py-8 text-white sm:px-8">
      <section className="mx-auto max-w-4xl pb-12">
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
        to="/host/dashboard"
      >
        <ArrowLeft aria-hidden="true" size={16} />
        Back to dashboard
      </Link>

      {error && (
        <div className="mt-6 rounded-xl border border-rose-300/20 bg-rose-300/[0.08] p-4 text-sm text-rose-200" role="alert">
          {error}
        </div>
      )}

      <div className="mt-7 flex flex-wrap items-center gap-2 text-xs font-bold tracking-[0.18em] text-violet-300 uppercase">
        <Radio aria-hidden="true" size={15} />
        Live game lobby
        <span className="ml-1 rounded-full bg-emerald-300/10 px-2.5 py-1 text-[10px] tracking-wide text-emerald-200">
          {game?.status === 'answerReview'
            ? 'SCOREBOARD'
            : (game?.status ?? 'CONNECTING').toUpperCase()}
        </span>
      </div>
      <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
        {game?.title ?? 'Starting your lobby…'}
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        Control the question flow for everyone in the room.
      </p>

      {game?.status === 'question' && question && (
        <div className="mt-8 rounded-3xl border border-white/10 bg-[#11172a] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-bold text-violet-200">
              Question {question.index + 1} of {game.totalQuestions}
            </span>
            <span className={`rounded-full px-3 py-1.5 text-sm font-bold ${!questionIsReading && secondsRemaining <= 5 ? 'bg-rose-400/10 text-rose-200' : 'bg-orange-400/10 text-orange-200'}`}>
              {questionIsReading ? `Reading: ${questionReadSecondsRemaining}s` : `${secondsRemaining}s remaining`}
            </span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-[width] duration-300 ${secondsRemaining <= 5 ? 'bg-rose-400' : 'bg-gradient-to-r from-violet-500 to-blue-400'}`}
              style={{ width: `${Math.min(100, (secondsRemaining / question.timeLimit) * 100)}%` }}
            />
          </div>
          <h2 className="mt-6 text-2xl font-bold leading-snug">{question.prompt}</h2>
          {question.imageUrl && <img alt="" className="mt-5 max-h-64 rounded-xl object-contain" src={question.imageUrl} />}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {question.options.map((option, index) => (
              <div className="rounded-xl border border-white/[0.08] bg-[#0b1020] p-4 text-sm" key={index}>
                <span className="mr-3 font-bold text-slate-500">{String.fromCharCode(65 + index)}</span>{option}
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-col gap-4 border-t border-white/[0.08] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-300">
              {Object.keys(answers).length} / {participants.length} players answered
            </p>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5 disabled:opacity-50"
              disabled={working || questionIsReading}
              onClick={() => void handleCloseQuestion()}
              type="button"
            >
              {working && <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />}
              Close question
            </button>
          </div>
        </div>
      )}

      {game?.status === 'answerReview' && question && game.answerReveal && (
        <div className="mt-8">
          {showAnswerDistribution ? (
            <AnswerDistribution
              answers={answers}
              correctIndex={game.answerReveal.correctIndex}
              question={question}
              questionNumber={question.index + 1}
            />
          ) : (
            <QuestionScoreboard
              action={question.index + 1 < game.totalQuestions ? (
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-violet-900 shadow-lg shadow-black/15 transition hover:bg-violet-50 disabled:opacity-50"
                  disabled={working}
                  onClick={handleStartNextQuestion}
                  type="button"
                >
                  {working && <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />}
                  Next question
                </button>
              ) : (
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-violet-900 shadow-lg shadow-black/15 transition hover:bg-violet-50 disabled:opacity-50"
                  disabled={working}
                  onClick={() => void handleEndGame()}
                  type="button"
                >
                  {working && <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />}
                  End game
                </button>
              )}
              questionNumber={question.index + 1}
              scores={scores}
            />
          )}
        </div>
      )}

      {game?.status === 'countdown' && (
        <div
          aria-live="polite"
          className="mt-8 flex flex-col items-center rounded-3xl border border-violet-300/20 bg-violet-300/[0.08] p-6 text-center"
          role="status"
        >
          <span className="inline-flex items-center gap-3 text-sm font-semibold text-violet-100">
            <LoaderCircle aria-hidden="true" className="animate-spin" size={18} />
            {nextQuestionSecondsRemaining > 0
              ? 'The countdown is running for participants.'
              : 'Starting the next question…'}
          </span>
          {nextQuestionSecondsRemaining === 0 && error && (
            <button
              className="mt-5 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5"
              disabled={working}
              onClick={handleRetryStartingQuestion}
              type="button"
            >
              Retry starting question
            </button>
          )}
        </div>
      )}

      {game?.status === 'answerReview' && !game.answerReveal && (
        <div className="mt-8 flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-[#11172a] p-6 text-center text-sm text-slate-300">
          <span className="inline-flex items-center gap-3">
            <LoaderCircle aria-hidden="true" className="animate-spin text-violet-300" size={18} />
            Calculating scores in the host app…
          </span>
          {error && (
            <button
              className="rounded-xl border border-white/10 px-4 py-2 font-semibold text-white hover:bg-white/5"
              disabled={working}
              onClick={() => void handleCloseQuestion()}
              type="button"
            >
              Retry score calculation
            </button>
          )}
        </div>
      )}

      {game?.status === 'ended' && (
        <div className="mt-8">
          <div className="mb-5 rounded-3xl border border-white/10 bg-[#11172a] p-8 text-center">
            <h2 className="text-2xl font-bold">Quiz questions complete</h2>
            <p className="mt-3 text-slate-400">
              Final results are saved. Show the leaderboard when you’re ready to reveal the final rankings.
            </p>
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={working}
            onClick={() => void handleShowFinalLeaderboard()}
            type="button"
          >
            {working && <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />}
            Show final leaderboard
          </button>
        </div>
      )}
      </section>
    </main>
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

export default HostGame
