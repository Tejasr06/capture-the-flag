import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, Copy, LoaderCircle, Radio, Users, Wifi, WifiOff } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Leaderboard from '../components/Leaderboard'
import { useAuth } from '../hooks/useAuth'
import type { LiveGame, LiveScore } from '../types/game'
import {
  closeQuestion,
  endLiveGame,
  getLiveGameErrorMessage,
  publishQuestion,
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
  const [serverTime, setServerTime] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [scores, setScores] = useState<LiveScore[]>([])
  const [working, setWorking] = useState(false)
  const closeStarted = useRef(false)

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

  useEffect(() => watchServerTime(setServerTime), [])

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
  const question = game?.currentQuestion
  const questionDeadline = question ? question.startedAt + question.timeLimit * 1000 : 0
  const secondsRemaining = question
    ? Math.max(0, Math.ceil((questionDeadline - serverTime) / 1000))
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
        <div className="mt-6 rounded-xl border border-rose-300/20 bg-rose-300/[0.08] p-4 text-sm text-rose-200" role="alert">
          {error}
        </div>
      )}

      <div className="mt-7 flex flex-wrap items-center gap-2 text-xs font-bold tracking-[0.18em] text-violet-300 uppercase">
        <Radio aria-hidden="true" size={15} />
        Live game lobby
        <span className="ml-1 rounded-full bg-emerald-300/10 px-2.5 py-1 text-[10px] tracking-wide text-emerald-200">
          {game?.status === 'lobby'
            ? 'WAITING FOR PLAYERS'
            : game?.status === 'answerReview'
              ? 'ANSWER REVIEW'
              : (game?.status ?? 'CONNECTING').toUpperCase()}
        </span>
      </div>
      <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
        {game?.title ?? 'Starting your lobby…'}
      </h1>
      <p className="mt-2 text-sm text-slate-400">
        {game?.status === 'lobby'
          ? 'Share the PIN with your players. Their names appear here as they join.'
          : 'Control the question flow for everyone in the room.'}
      </p>

      {game?.status === 'lobby' && (
        <div className="mt-8 rounded-3xl border border-violet-300/15 bg-gradient-to-br from-violet-500/15 to-[#11172a] p-6 text-center sm:p-8">
          <p className="text-xs font-bold tracking-[0.2em] text-violet-200 uppercase">Game PIN</p>
          {game ? (
            <p aria-label={`Game PIN ${pin}`} className="mt-4 text-6xl font-black tracking-[0.2em] text-white sm:text-7xl">
              {pin}
            </p>
          ) : (
            <div className="mx-auto mt-8 h-16 w-52 animate-pulse rounded-xl bg-white/10" />
          )}
          <button
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
            disabled={!game}
            onClick={() => void copyJoinDetails()}
            type="button"
          >
            {copied ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}
            {copied ? 'Copied join details' : 'Copy join details'}
          </button>
          <p className="mt-4 text-xs text-slate-400">
            Players can visit <span className="font-semibold text-slate-200">{window.location.host}/join</span>
          </p>
        </div>
      )}
      {game?.status === 'lobby' && (
        <div className="mt-5 grid gap-5 md:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-white/10 bg-[#11172a] p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div>
              <h2 className="font-bold">Players in the lobby</h2>
              <p className="mt-1 text-xs text-slate-400">Updates live</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-400/10 px-3 py-1.5 text-sm font-bold text-blue-200">
              <Users aria-hidden="true" size={15} />
              {participants.length}
            </span>
          </div>
          {!game ? (
            <div className="grid min-h-44 place-items-center text-sm text-slate-400">
              <span className="inline-flex items-center gap-3">
                <LoaderCircle aria-hidden="true" className="animate-spin text-violet-300" size={18} />
                Connecting to the lobby…
              </span>
            </div>
          ) : participants.length === 0 ? (
            <div className="grid min-h-44 place-items-center text-center">
              <div>
                <span className="mx-auto grid size-11 place-items-center rounded-xl bg-white/[0.06] text-slate-400">
                  <Users aria-hidden="true" size={20} />
                </span>
                <p className="mt-3 text-sm font-semibold text-slate-200">Waiting for the first player</p>
                <p className="mt-1 text-xs text-slate-500">Share the PIN to invite your group.</p>
              </div>
            </div>
          ) : (
            <ul className="mt-2 max-h-80 divide-y divide-white/[0.06] overflow-y-auto">
              {participants.map((participant, index) => (
                <li className="flex items-center gap-3 py-3" key={participant.uid}>
                  <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-violet-400/20 to-blue-400/10 text-sm font-bold text-violet-100">
                    {participant.nickname.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{participant.nickname}</span>
                  <span className="text-xs text-slate-500">#{index + 1}</span>
                  {participant.connected ? (
                    <Wifi aria-label="Connected" className="text-emerald-300" size={15} />
                  ) : (
                    <WifiOff aria-label="Disconnected" className="text-slate-500" size={15} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
          <div className="flex flex-col justify-center rounded-3xl border border-white/10 bg-[#11172a] p-6">
            <p className="text-sm leading-6 text-slate-300">
              {participants.length === 0
                ? 'Share the Game PIN, then start when your group is ready.'
                : `${participants.length} ${participants.length === 1 ? 'player is' : 'players are'} in the lobby.`}
            </p>
            <button
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!game || working || participants.length === 0}
              onClick={() => void handleStartQuestion(0)}
              type="button"
            >
              {working ? <LoaderCircle aria-hidden="true" className="animate-spin" size={17} /> : <Radio aria-hidden="true" size={17} />}
              Start Question 1
            </button>
            {participants.length === 0 && (
              <p className="mt-3 text-xs text-slate-500">At least one player must join first.</p>
            )}
          </div>
        </div>
      )}

      {game?.status === 'question' && question && (
        <div className="mt-8 rounded-3xl border border-white/10 bg-[#11172a] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-bold text-violet-200">
              Question {question.index + 1} of {game.totalQuestions}
            </span>
            <span className={`rounded-full px-3 py-1.5 text-sm font-bold ${secondsRemaining <= 5 ? 'bg-rose-400/10 text-rose-200' : 'bg-orange-400/10 text-orange-200'}`}>
              {secondsRemaining}s remaining
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
              disabled={working}
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
        <div className="mt-8 rounded-3xl border border-emerald-300/15 bg-[#11172a] p-5 sm:p-7">
          <span className="text-sm font-bold text-emerald-200">Question {question.index + 1} · Answer revealed</span>
          <h2 className="mt-3 text-2xl font-bold leading-snug">{question.prompt}</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {question.options.map((option, index) => (
              <div className={`rounded-xl border p-4 text-sm ${index === game.answerReveal?.correctIndex ? 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100' : 'border-white/[0.08] bg-[#0b1020] text-slate-300'}`} key={index}>
                <span className="mr-3 font-bold opacity-60">{String.fromCharCode(65 + index)}</span>{option}
                {index === game.answerReveal.correctIndex && <span className="ml-2 text-xs font-bold text-emerald-200">CORRECT</span>}
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm text-slate-400">
            {Object.keys(answers).length} of {participants.length} players answered. The host app calculated and published these scores.
          </p>
          {question.index + 1 < game.totalQuestions ? (
            <button
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-violet-400 disabled:opacity-50"
              disabled={working}
              onClick={() => void handleStartQuestion(question.index + 1)}
              type="button"
            >
              {working && <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />}
              Start Question {question.index + 2}
            </button>
          ) : (
            <button
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-violet-400 disabled:opacity-50"
              disabled={working}
              onClick={() => void handleEndGame()}
              type="button"
            >
              {working && <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />}
              End game
            </button>
          )}
          <div className="mt-7">
            <Leaderboard scores={scores} title="Live leaderboard" />
          </div>
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
            <p className="mt-3 text-slate-400">Final results have been saved.</p>
          </div>
          <Leaderboard scores={scores} title="Final winners" variant="podium" />
          <Link className="mt-6 inline-flex rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/5" to="/host/dashboard">
            Return to dashboard
          </Link>
        </div>
      )}
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

export default HostGame
