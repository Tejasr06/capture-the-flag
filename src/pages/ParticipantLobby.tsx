import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, Clock3, Flag, LoaderCircle, LogOut, Radio, Users, Wifi, WifiOff } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import FinalLeaderboard from '../components/FinalLeaderboard'
import ParticipantAvatar from '../components/ParticipantAvatar'
import { useAuth } from '../hooks/useAuth'
import type { LiveGame, LiveScore } from '../types/game'
import {
  getLiveGameErrorMessage,
  leaveLiveGame,
  joinLiveGame,
  submitAnswer,
  watchLiveGame,
  watchLiveScores,
  watchParticipantAnswer,
  watchServerTime,
} from '../services/gameService'

function ParticipantLobby() {
  const { pin } = useParams()
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [game, setGame] = useState<LiveGame | null>(null)
  const [error, setError] = useState('')
  const [submittedOption, setSubmittedOption] = useState<number | null>(null)
  const [selection, setSelection] = useState<{
    questionIndex: number
    optionIndex: number
  } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [serverTime, setServerTime] = useState(() => Date.now())
  const [serverTimeReady, setServerTimeReady] = useState(false)
  const [scores, setScores] = useState<LiveScore[]>([])
  const reconnectStarted = useRef(false)
  const gameStatus = game?.status

  useEffect(() => {
    if (!pin || !user) return
    return watchLiveGame(
      pin,
      (nextGame) => {
        if (!nextGame) {
          setError('This game is no longer available.')
          return
        }
        if (!nextGame.participants[user.uid]) {
          setError('Your participant session was not found. Join the game again with its PIN.')
          return
        }
        setError('')
        setGame(nextGame)
      },
      setError,
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
    if (!pin || !user || (gameStatus !== 'ended' && gameStatus !== 'leaderboard')) return
    return watchLiveScores(pin, setScores, setError)
  }, [gameStatus, pin, user])

  const question = game?.currentQuestion
  const participant = game?.participants[user?.uid ?? '']
  useEffect(() => {
    if (
      !pin ||
      !user ||
      gameStatus !== 'lobby' ||
      leaving ||
      !participant ||
      participant.connected ||
      reconnectStarted.current
    ) {
      return
    }

    reconnectStarted.current = true
    joinLiveGame(pin, participant.nickname)
      .catch((reconnectError: unknown) =>
        setError(`Reconnecting to the lobby failed: ${getLiveGameErrorMessage(reconnectError)}`),
      )
      .finally(() => {
        reconnectStarted.current = false
      })
  }, [gameStatus, leaving, participant, pin, user])

  const questionIndex = question?.index
  const questionStartedAt = question?.startedAt
  useEffect(() => {
    if (!pin || !user || questionIndex === undefined || questionStartedAt === undefined) return
    return watchParticipantAnswer(pin, user.uid, setSubmittedOption, setError)
  }, [pin, questionIndex, questionStartedAt, user])

  if (loading) return <Loading label="Restoring your participant session…" />
  if (!user) return <Navigate replace to="/join" />
  if (!pin || !/^\d{6}$/.test(pin)) return <Navigate replace to="/join" />

  const selectedOption =
    question && selection?.questionIndex === question.index
      ? selection.optionIndex
      : null
  const sortedParticipants = Object.values(game?.participants ?? {}).sort(
    (a, b) => a.joinedAt - b.joinedAt,
  )
  const connectedParticipants = sortedParticipants.filter((item) => item.connected)
  const secondsRemaining = question
    ? Math.max(
        0,
        Math.ceil(
          (question.startedAt + question.timeLimit * 1000 - serverTime) / 1000,
        ),
      )
    : 0
  const nextQuestionSecondsRemaining =
    game?.countdownEndsAt !== undefined
      ? serverTimeReady
        ? Math.max(0, Math.ceil((game.countdownEndsAt - serverTime) / 1000))
        : 5
      : 0

  async function handleSubmitAnswer() {
    if (!pin || !user || selectedOption === null || submittedOption !== null) return
    setError('')
    setSubmitting(true)
    try {
      await submitAnswer(pin, user.uid, selectedOption)
      setSubmittedOption(selectedOption)
    } catch (submitError) {
      setError(getLiveGameErrorMessage(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLeaveLobby() {
    if (!pin || !user) return
    setError('')
    setLeaving(true)
    try {
      await leaveLiveGame(pin, user.uid)
      navigate('/join', { replace: true })
    } catch (leaveError: unknown) {
      setError(`Leaving the lobby failed: ${getLiveGameErrorMessage(leaveError)}`)
      setLeaving(false)
    }
  }

  if (game?.status === 'leaderboard') {
    return <FinalLeaderboard currentUid={user.uid} error={error} scores={scores} />
  }

  if (game?.status === 'lobby' && participant) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#dce8f7] px-4 py-7 text-slate-900 sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute -left-36 top-24 size-80 rounded-full bg-white/70 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-1/3 size-96 rounded-full bg-sky-300/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-48 left-1/4 size-[32rem] rounded-full bg-emerald-200/30 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          {error && (
            <div className="mt-5 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
              {error}
              {error.includes('Join the game again') && (
                <Link className="ml-2 font-semibold underline" to="/join">Join again</Link>
              )}
            </div>
          )}

          <header className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-900 px-4 py-2 text-sm font-black text-white shadow-lg shadow-violet-900/20">
              <Flag aria-hidden="true" size={17} />
              Capture the Flag!
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              You’re in, {participant.nickname}!
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-600">
              {game.title} · Waiting for the host to start
            </p>
          </header>

          <section className="mt-7 rounded-3xl border border-white/80 bg-white/75 p-4 shadow-xl shadow-slate-700/10 backdrop-blur-sm sm:p-7">
            <div className="mb-4 flex justify-end">
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                disabled={leaving}
                onClick={() => void handleLeaveLobby()}
                type="button"
              >
                {leaving ? (
                  <LoaderCircle aria-hidden="true" className="animate-spin" size={15} />
                ) : (
                  <LogOut aria-hidden="true" size={15} />
                )}
                {leaving ? 'Leaving…' : 'Leave lobby'}
              </button>
            </div>
            <div className="mx-auto flex max-w-2xl flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-center sm:flex-row sm:text-left">
              <div>
                <p className="text-xs font-bold tracking-[0.18em] text-slate-500 uppercase">Game PIN</p>
                <p className="mt-1 text-3xl font-black tracking-[0.12em] text-slate-900 sm:text-4xl">{pin}</p>
              </div>
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                participant.connected
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'bg-amber-50 text-amber-800'
              }`}>
                {participant.connected ? (
                  <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                ) : (
                  <LoaderCircle aria-hidden="true" className="animate-spin" size={13} />
                )}
                {participant.connected ? 'Connected' : 'Reconnecting'}
              </span>
            </div>

            <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-black sm:text-2xl">Players in the lobby</h2>
                <p className="mt-1 text-sm text-slate-600">Your character is ready. Hang tight!</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-violet-900 px-4 py-2 text-sm font-bold text-white">
                <Users aria-hidden="true" size={16} />
                {connectedParticipants.length} {connectedParticipants.length === 1 ? 'player' : 'players'} joined
              </span>
            </div>

            {connectedParticipants.length === 0 ? (
              <div className="mt-6 grid min-h-40 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/50 text-center text-sm text-slate-500">
                Waiting for connected players…
              </div>
            ) : (
              <ul aria-label="Connected players" className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {connectedParticipants.map((item) => (
                  <li
                    className={`flex min-w-0 items-center gap-3 rounded-2xl border p-3 shadow-sm transition ${
                      item.uid === user.uid
                        ? 'border-violet-300 bg-violet-50'
                        : 'border-slate-200 bg-white/90'
                    }`}
                    key={item.uid}
                  >
                    <ParticipantAvatar avatarId={item.avatarId} size="lg" uid={item.uid} />
                    <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800 sm:text-base">
                      {item.nickname}
                    </span>
                    {item.uid === user.uid && (
                      <span className="rounded-full bg-violet-900/10 px-2 py-1 text-[10px] font-black text-violet-900">
                        YOU
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-7 flex items-center justify-center gap-2 border-t border-slate-200 pt-5 text-sm font-semibold text-slate-600">
              <LoaderCircle aria-hidden="true" className="animate-spin text-violet-700" size={16} />
              The host will start the game soon
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b1020] px-5 py-10 text-white sm:px-8">
      <div className="pointer-events-none absolute -left-40 top-10 size-96 rounded-full bg-violet-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute -right-36 bottom-0 size-96 rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="relative mx-auto max-w-2xl">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
          to="/"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          QuizArena
        </Link>
        <section className="mt-7 rounded-3xl border border-white/10 bg-[#11172a]/95 p-6 shadow-2xl shadow-black/20 sm:p-9">
          {error && (
            <div className="mb-6 rounded-xl border border-rose-300/20 bg-rose-300/[0.08] p-4 text-sm leading-6 text-rose-200" role="alert">
              {error}
              {error.includes('Join the game again') && (
                <Link className="ml-2 font-semibold underline" to="/join">Join again</Link>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[0.08] px-3 py-1.5 text-xs font-semibold text-emerald-200">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-300" />
              {game?.status === 'lobby'
                ? 'IN THE LOBBY'
                : game?.status === 'answerReview'
                  ? 'ANSWER REVEALED'
                  : game?.status === 'countdown'
                    ? 'GET READY'
                  : (game?.status ?? 'CONNECTING').toUpperCase()}
            </span>
            <span className="text-xs font-semibold tracking-wider text-slate-400">PIN {pin}</span>
          </div>
          <h1 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">
            {game?.status === 'countdown'
              ? 'Get ready for the next question'
              : game?.status === 'question' && question
              ? `Question ${question.index + 1} of ${game.totalQuestions}`
              : game?.status === 'answerReview'
                ? 'Answer revealed'
                : game?.status === 'ended'
                  ? 'Quiz complete'
                  : participant
                    ? `You’re in, ${participant.nickname}!`
                    : 'Joining the lobby…'}
          </h1>
          <p className="mt-3 leading-7 text-slate-300">{game?.title ?? 'Connecting to the game'}</p>

          {game?.status === 'countdown' && (
            <section
              aria-live="polite"
              className="mt-8 flex flex-col items-center rounded-2xl border border-violet-300/20 bg-violet-300/[0.08] px-5 py-8 text-center"
              role="status"
            >
              <span className="grid size-24 place-items-center rounded-3xl bg-violet-400/15 text-6xl font-black tabular-nums text-violet-100">
                {nextQuestionSecondsRemaining}
              </span>
              <p className="mt-2 text-sm text-slate-300">
                The next question starts in {nextQuestionSecondsRemaining} seconds.
              </p>
            </section>
          )}

          {game?.status === 'question' && question && (
            <section aria-label={`Question ${question.index + 1}`} className="mt-7">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold text-slate-300">Choose one answer</span>
                <span
                  aria-live="polite"
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${
                    secondsRemaining <= 5
                      ? 'bg-rose-400/10 text-rose-200'
                      : 'bg-orange-400/10 text-orange-200'
                  }`}
                >
                  <Clock3 aria-hidden="true" size={15} />
                  {secondsRemaining}s
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full transition-[width] duration-300 ${
                    secondsRemaining <= 5
                      ? 'bg-rose-400'
                      : 'bg-gradient-to-r from-violet-500 to-blue-400'
                  }`}
                  style={{
                    width: `${Math.min(100, (secondsRemaining / question.timeLimit) * 100)}%`,
                  }}
                />
              </div>
              <h2 className="mt-6 text-2xl font-bold leading-snug">{question.prompt}</h2>
              {question.imageUrl && (
                <img
                  alt=""
                  className="mt-5 max-h-64 w-full rounded-xl border border-white/10 object-contain"
                  src={question.imageUrl}
                />
              )}
              <div className="mt-5 grid gap-3">
                {question.options.map((option, index) => {
                  const isSelected = selectedOption === index
                  return (
                    <button
                      aria-pressed={isSelected}
                      className={`flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                        isSelected
                          ? 'border-violet-300/50 bg-violet-400/15 text-white'
                          : 'border-white/[0.08] bg-[#0b1020] text-slate-200 hover:border-white/20'
                      } disabled:cursor-not-allowed disabled:opacity-70`}
                      disabled={submittedOption !== null || secondsRemaining === 0 || submitting}
                      key={index}
                      onClick={() => setSelection({ questionIndex: question.index, optionIndex: index })}
                      type="button"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.07] text-xs font-bold">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="flex-1">{option}</span>
                      {isSelected && <Check aria-hidden="true" className="text-violet-200" size={17} />}
                    </button>
                  )
                })}
              </div>
              {submittedOption !== null ? (
                <p className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.08] p-4 text-sm font-semibold text-emerald-100" role="status">
                  Answer submitted. You can’t change it. Wait for the host to close the question.
                </p>
              ) : (
                <button
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={selectedOption === null || secondsRemaining === 0 || submitting}
                  onClick={() => void handleSubmitAnswer()}
                  type="button"
                >
                  {submitting && <LoaderCircle aria-hidden="true" className="animate-spin" size={17} />}
                  {submitting ? 'Submitting…' : secondsRemaining === 0 ? 'Time is up' : 'Submit answer'}
                </button>
              )}
            </section>
          )}

          {game?.status === 'answerReview' && question && game.answerReveal && (
            <section aria-live="polite" className="mt-7">
              <h2 className="text-2xl font-bold leading-snug">{question.prompt}</h2>
              <div className="mt-5 grid gap-3">
                {question.options.map((option, index) => (
                  <div
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                      index === game.answerReveal?.correctIndex
                        ? 'border-emerald-300/30 bg-emerald-300/[0.08] text-emerald-100'
                        : index === submittedOption
                          ? 'border-rose-300/30 bg-rose-300/[0.06] text-rose-100'
                          : 'border-white/[0.08] bg-[#0b1020] text-slate-300'
                    }`}
                    key={index}
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-white/[0.07] text-xs font-bold">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1">{option}</span>
                    {index === game.answerReveal.correctIndex && (
                      <Check aria-label="Correct answer" className="text-emerald-300" size={17} />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {game?.status === 'answerReview' && !game.answerReveal && (
            <p className="mt-7 inline-flex items-center gap-3 text-sm text-slate-300" role="status">
              <LoaderCircle aria-hidden="true" className="animate-spin text-violet-300" size={18} />
              The host is calculating scores…
            </p>
          )}

          {game?.status === 'ended' && (
            <div className="mt-7">
              <div className="mb-5 rounded-2xl border border-violet-300/15 bg-violet-300/[0.06] p-5">
                <h2 className="font-bold">Thanks for playing!</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Your final score is {scores.find((score) => score.uid === user.uid)?.totalPoints ?? 0} points.
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  The host will show the final leaderboard shortly.
                </p>
              </div>
            </div>
          )}

          {(game?.status === 'lobby' || !game) && (
            <>
              <div className="mt-7 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#0b1020] p-4">
                {participant?.connected ? (
                  <Wifi aria-hidden="true" className="text-emerald-300" size={19} />
                ) : (
                  <LoaderCircle aria-hidden="true" className="animate-spin text-violet-300" size={19} />
                )}
                <div>
                  <p className="text-sm font-semibold">
                    {participant?.connected ? 'Connected to the game' : 'Connecting…'}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Keep this page open. Your host will start when everyone is ready.
                  </p>
                </div>
                {participant && !participant.connected && (
                  <WifiOff aria-label="Disconnected" className="ml-auto text-slate-500" size={16} />
                )}
              </div>

              <div className="mt-7 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold">Players here</h2>
                    <p className="mt-1 text-xs text-slate-400">Waiting for the host to begin</p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-violet-400/10 px-3 py-1.5 text-sm font-bold text-violet-200">
                    <Users aria-hidden="true" size={15} />
                    {sortedParticipants.length}
                  </span>
                </div>
                {sortedParticipants.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {sortedParticipants.map((item) => (
                      <span
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                          item.uid === user.uid
                            ? 'border-violet-300/30 bg-violet-300/10 text-violet-100'
                            : 'border-white/[0.08] bg-white/[0.04] text-slate-300'
                        }`}
                        key={item.uid}
                      >
                        {item.nickname}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {!game && !error && (
            <div className="mt-6 inline-flex items-center gap-2 text-sm text-slate-400">
              <Radio aria-hidden="true" className="animate-pulse text-violet-300" size={16} />
              Syncing live lobby…
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function Loading({ label }: { label: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0b1020] text-sm text-slate-300">
      <span className="inline-flex items-center gap-3">
        <LoaderCircle aria-hidden="true" className="animate-spin text-violet-300" size={20} />
        {label}
      </span>
    </main>
  )
}

export default ParticipantLobby
