import { signInAnonymously } from 'firebase/auth'
import {
  get,
  onDisconnect,
  onValue,
  ref,
  runTransaction,
  serverTimestamp,
  set,
  update,
  type DatabaseReference,
} from 'firebase/database'
import { auth, getDatabase, getRealtimeDatabase } from './firebase'
import { getQuiz } from './quizService'
import type { LiveGame, LiveParticipant, LiveScore } from '../types/game'

const PIN_ATTEMPTS = 20

function getConfiguredAuth() {
  if (!auth) {
    throw new Error('Firebase is not configured. Set up your Firebase web app settings first.')
  }
  return auth
}

function makePin() {
  const value = new Uint32Array(1)
  crypto.getRandomValues(value)
  return String(100000 + (value[0] % 900000))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseGame(pin: string, value: unknown): LiveGame {
  if (
    !isRecord(value) ||
    typeof value.hostUid !== 'string' ||
    typeof value.quizId !== 'string' ||
    typeof value.title !== 'string' ||
    !['lobby', 'question', 'answerReview', 'countdown', 'leaderboard', 'ended'].includes(String(value.status)) ||
    typeof value.lateJoining !== 'boolean' ||
    typeof value.createdAt !== 'number' ||
    typeof value.totalQuestions !== 'number'
  ) {
    throw new Error('The live game data is incomplete or invalid.')
  }

  const participants: Record<string, LiveParticipant> = {}
  if (isRecord(value.participants)) {
    for (const [uid, participant] of Object.entries(value.participants)) {
      if (
        isRecord(participant) &&
        typeof participant.uid === 'string' &&
        typeof participant.nickname === 'string' &&
        typeof participant.nicknameKey === 'string' &&
        typeof participant.joinedAt === 'number' &&
        typeof participant.connected === 'boolean'
      ) {
        participants[uid] = {
          uid: participant.uid,
          nickname: participant.nickname,
          nicknameKey: participant.nicknameKey,
          joinedAt: participant.joinedAt,
          connected: participant.connected,
        }
      }
    }
  }

  let currentQuestion: LiveGame['currentQuestion'] = null
  if (isRecord(value.currentQuestion)) {
    const question = value.currentQuestion
    if (
      typeof question.index === 'number' &&
      typeof question.prompt === 'string' &&
      Array.isArray(question.options) &&
      question.options.length === 4 &&
      question.options.every((option) => typeof option === 'string') &&
      typeof question.imageUrl === 'string' &&
      typeof question.timeLimit === 'number' &&
      typeof question.startedAt === 'number'
    ) {
      currentQuestion = {
        index: question.index,
        prompt: question.prompt,
        options: question.options as [string, string, string, string],
        imageUrl: question.imageUrl,
        timeLimit: question.timeLimit,
        startedAt: question.startedAt,
      }
    }
  }

  let answerReveal: LiveGame['answerReveal'] = null
  if (isRecord(value.answerReveal) && typeof value.answerReveal.correctIndex === 'number') {
    answerReveal = { correctIndex: value.answerReveal.correctIndex }
  }

  const nextQuestionIndex =
    typeof value.nextQuestionIndex === 'number' && Number.isInteger(value.nextQuestionIndex)
      ? value.nextQuestionIndex
      : undefined
  const countdownEndsAt =
    typeof value.countdownEndsAt === 'number' && Number.isFinite(value.countdownEndsAt)
      ? value.countdownEndsAt
      : undefined
  if (
    value.status === 'countdown' &&
    (nextQuestionIndex === undefined ||
      nextQuestionIndex < 0 ||
      nextQuestionIndex >= value.totalQuestions ||
      countdownEndsAt === undefined)
  ) {
    throw new Error('The next-question countdown data is incomplete or invalid.')
  }

  return {
    pin,
    hostUid: value.hostUid,
    quizId: value.quizId,
    title: value.title,
    status: value.status as LiveGame['status'],
    lateJoining: value.lateJoining,
    createdAt: value.createdAt,
    totalQuestions: value.totalQuestions,
    participants,
    currentQuestion,
    answerReveal,
    nextQuestionIndex,
    countdownEndsAt,
    resultId: typeof value.resultId === 'string' ? value.resultId : undefined,
  }
}

function normalizeNickname(nickname: string) {
  return nickname.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

async function getNicknameKey(nickname: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Secure nickname checks are unavailable in this browser. Use a current browser over HTTPS or localhost.')
  }

  const bytes = new TextEncoder().encode(normalizeNickname(nickname))
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function getErrorCode(error: unknown) {
  return isRecord(error) && typeof error.code === 'string' ? error.code : ''
}

function formatRealtimeError(error: unknown): string {
  const code = getErrorCode(error)
  if (code === 'auth/operation-not-allowed') {
    return 'Anonymous sign-in is disabled. Enable Anonymous under Firebase Authentication → Sign-in method.'
  }
  if (code === 'auth/network-request-failed') {
    return 'Could not sign in anonymously. Check your internet connection and try again.'
  }
  if (code === 'PERMISSION_DENIED' || code === 'permission-denied') {
    return 'Firebase denied access. Check that Realtime Database is created, Anonymous sign-in is enabled, and database.rules.json has been published.'
  }
  if (code === 'NETWORK_ERROR' || code === 'unavailable') {
    return 'Could not reach Firebase Realtime Database. Check your connection and database URL.'
  }
  return error instanceof Error ? error.message : 'Something went wrong while connecting to the live game.'
}

function getServerTimeOffset(database: Awaited<ReturnType<typeof getRealtimeDatabase>>): Promise<number> {
  return new Promise((resolve, reject) => {
    let unsubscribe: (() => void) | undefined
    unsubscribe = onValue(
      ref(database, '.info/serverTimeOffset'),
      (snapshot) => {
        unsubscribe?.()
        const offset = snapshot.val()
        resolve(typeof offset === 'number' ? offset : 0)
      },
      (error) => {
        unsubscribe?.()
        reject(error)
      },
    )
  })
}

export async function createLiveGame(quizId: string, hostUid: string): Promise<string> {
  const user = getConfiguredAuth().currentUser
  if (!user || user.uid !== hostUid || user.isAnonymous) {
    throw new Error('Your host session expired. Sign in again before starting a live quiz.')
  }

  const quiz = await getQuiz(quizId)
  if (!quiz) throw new Error('Quiz not found.')
  if (quiz.hostId !== hostUid) throw new Error('You can only host your own quiz.')

  const database = await getRealtimeDatabase()
  for (let attempt = 0; attempt < PIN_ATTEMPTS; attempt += 1) {
    const pin = makePin()
    const gameReference = ref(database, `liveGames/${pin}`)
    try {
      const reservation = await runTransaction(
        gameReference,
        (currentValue) =>
          currentValue === null
            ? {
                hostUid,
                quizId: quiz.id,
                title: quiz.title,
                status: 'lobby',
                lateJoining: false,
                createdAt: Date.now(),
                totalQuestions: quiz.questions.length,
              }
            : undefined,
        { applyLocally: false },
      )
      if (!reservation.committed) continue
    } catch (error) {
      if (getErrorCode(error) === 'PERMISSION_DENIED') continue
      throw new Error(formatRealtimeError(error))
    }

    try {
      await set(ref(database, `gameStatus/${pin}`), {
        status: 'lobby',
        lateJoining: false,
      })
      return pin
    } catch (error) {
      try {
        const { remove } = await import('firebase/database')
        await remove(gameReference)
        await remove(ref(database, `gameStatus/${pin}`))
      } catch (cleanupError) {
        throw new Error(
          `${formatRealtimeError(error)} Cleanup failed: ${formatRealtimeError(cleanupError)}`,
        )
      }
      throw new Error(formatRealtimeError(error))
    }
  }

  throw new Error('Could not reserve a unique game PIN. Check that the Realtime Database rules are published, then try again.')
}

export async function joinLiveGame(pin: string, nickname: string): Promise<string> {
  const normalizedNickname = nickname.trim().replace(/\s+/g, ' ')
  if (!/^[\p{L}\p{N} _.-]{2,20}$/u.test(normalizedNickname)) {
    throw new Error('Nickname must be 2–20 characters using letters, numbers, spaces, dots, dashes, or underscores.')
  }
  if (!/^\d{6}$/.test(pin)) {
    throw new Error('Enter a six-digit Game PIN.')
  }

  const authInstance = getConfiguredAuth()
  let user = authInstance.currentUser
  if (user && !user.isAnonymous) {
    throw new Error('You are signed in as a host in this browser. Join from a private window or another device so your host session stays safe.')
  }
  if (!user) {
    const credential = await signInAnonymously(authInstance)
    user = credential.user
  }

  const database = await getRealtimeDatabase()
  const statusRef = ref(database, `gameStatus/${pin}/status`)
  const statusSnapshot = await get(statusRef).catch((error: unknown) => {
    throw new Error(`Could not check the Game PIN status: ${formatRealtimeError(error)}`)
  })
  if (!statusSnapshot.exists()) {
    throw new Error('That Game PIN was not found. Check the six digits and try again.')
  }
  if (statusSnapshot.val() !== 'lobby') {
    throw new Error('This game has already started or ended and is not accepting players.')
  }

  const participantReference = ref(database, `liveGames/${pin}/participants/${user.uid}`)
  const participantSnapshot = await get(participantReference).catch((error: unknown) => {
    throw new Error(`Could not check your participant record: ${formatRealtimeError(error)}`)
  })
  const nicknameKey = await getNicknameKey(normalizedNickname)

  if (participantSnapshot.exists()) {
    const existing = participantSnapshot.val() as Partial<LiveParticipant>
    if (existing.nicknameKey !== nicknameKey) {
      throw new Error(`This browser has already joined as "${existing.nickname ?? 'another nickname'}". Use that nickname or join from another device.`)
    }
    await update(participantReference, { connected: true })
    await onDisconnect(participantReference).update({ connected: false })
    return user.uid
  }

  const claimReference = ref(database, `liveGames/${pin}/nicknames/${nicknameKey}`)
  const claim = await runTransaction(
    claimReference,
    (currentValue) => (currentValue === null ? user.uid : undefined),
    { applyLocally: false },
  ).catch((error: unknown) => {
    throw new Error(`Could not reserve that nickname: ${formatRealtimeError(error)}`)
  })
  if (!claim.committed) {
    throw new Error('That nickname is already taken in this game. Choose another one.')
  }

  let participantCreated = false
  try {
    await set(participantReference, {
      uid: user.uid,
      nickname: normalizedNickname,
      nicknameKey,
      joinedAt: serverTimestamp(),
      connected: true,
    })
    participantCreated = true
    await onDisconnect(participantReference).update({ connected: false })
  } catch (error) {
    try {
      if (participantCreated) {
        const { remove } = await import('firebase/database')
        await remove(participantReference)
      }
      const release = await runTransaction(
        claimReference,
        (currentValue) => (currentValue === user.uid ? null : undefined),
        { applyLocally: false },
      )
      if (!release.committed) {
        throw new Error('Nickname claim was no longer owned by this participant.')
      }
    } catch (cleanupError) {
      throw new Error(
        `Could not create your participant record: ${formatRealtimeError(error)} Cleanup failed: ${formatRealtimeError(cleanupError)}`,
      )
    }
    throw new Error(`Could not create your participant record: ${formatRealtimeError(error)}`)
  }

  return user.uid
}

export async function publishQuestion(
  pin: string,
  questionIndex: number,
): Promise<void> {
  const host = getConfiguredAuth().currentUser
  if (!host || host.isAnonymous) {
    throw new Error('Sign in with the host account to start a question.')
  }
  const database = await getRealtimeDatabase()
  const gameSnapshot = await get(ref(database, `liveGames/${pin}`))
  if (!gameSnapshot.exists() || gameSnapshot.child('hostUid').val() !== host.uid) {
    throw new Error('You are not the host of this game.')
  }
  const status = gameSnapshot.child('status').val()
  if (
    (status === 'lobby' && questionIndex !== 0) ||
    (status === 'countdown' &&
      questionIndex !== gameSnapshot.child('nextQuestionIndex').val()) ||
    (status !== 'lobby' && status !== 'countdown')
  ) {
    throw new Error('The game is not ready to start that question.')
  }
  if (status === 'countdown') {
    const countdownEndsAt: unknown = gameSnapshot.child('countdownEndsAt').val()
    if (typeof countdownEndsAt !== 'number' || !Number.isFinite(countdownEndsAt)) {
      throw new Error('The next-question countdown deadline is invalid.')
    }
    const serverOffset = await getServerTimeOffset(database).catch((error: unknown) => {
      throw new Error(`Could not read server time: ${formatRealtimeError(error)}`)
    })
    if (Date.now() + serverOffset < countdownEndsAt) {
      throw new Error('Wait for the five-second countdown before starting the question.')
    }
  }

  const quiz = await getQuiz(String(gameSnapshot.child('quizId').val()))
  if (!quiz || quiz.hostId !== host.uid || !quiz.questions[questionIndex]) {
    throw new Error('The quiz question could not be verified for this host.')
  }
  const question = quiz.questions[questionIndex]
  const updates: Record<string, unknown> = {
    [`liveGames/${pin}/currentQuestion`]: {
      index: questionIndex,
      prompt: question.prompt,
      options: question.options,
      imageUrl: question.imageUrl,
      timeLimit: question.timeLimit,
      startedAt: serverTimestamp(),
    },
    [`liveGames/${pin}/status`]: 'question',
    [`gameStatus/${pin}/status`]: 'question',
  }
  if (gameSnapshot.child('answerReveal').exists()) {
    updates[`liveGames/${pin}/answerReveal`] = null
  }
  if (gameSnapshot.child('nextQuestionIndex').exists()) {
    updates[`liveGames/${pin}/nextQuestionIndex`] = null
  }
  if (gameSnapshot.child('countdownEndsAt').exists()) {
    updates[`liveGames/${pin}/countdownEndsAt`] = null
  }
  for (const uid of Object.keys(gameSnapshot.child('participants').val() ?? {})) {
    updates[`gameAnswers/${pin}/${uid}`] = null
  }
  await update(ref(database), updates)
}

export async function startNextQuestionCountdown(
  pin: string,
  hostUid: string,
): Promise<void> {
  const host = getConfiguredAuth().currentUser
  if (!host || host.uid !== hostUid || host.isAnonymous) {
    throw new Error('Your host session expired. Sign in again before starting the next question.')
  }

  const database = await getRealtimeDatabase()
  const gameReference = ref(database, `liveGames/${pin}`)
  const gameSnapshot = await get(gameReference)
  if (!gameSnapshot.exists() || gameSnapshot.child('hostUid').val() !== hostUid) {
    throw new Error('You are not the host of this game.')
  }
  const currentQuestionIndex: unknown = gameSnapshot.child('currentQuestion/index').val()
  const totalQuestions: unknown = gameSnapshot.child('totalQuestions').val()
  if (
    gameSnapshot.child('status').val() !== 'answerReview' ||
    !gameSnapshot.child('answerReveal').exists() ||
    typeof currentQuestionIndex !== 'number' ||
    !Number.isInteger(currentQuestionIndex) ||
    typeof totalQuestions !== 'number' ||
    currentQuestionIndex + 1 >= totalQuestions
  ) {
    throw new Error('The game is not ready to start another question.')
  }

  const serverOffset = await getServerTimeOffset(database).catch((error: unknown) => {
    throw new Error(`Could not read server time: ${formatRealtimeError(error)}`)
  })
  const nextQuestionIndex = currentQuestionIndex + 1
  const countdownEndsAt = Date.now() + serverOffset + 5000
  try {
    await update(ref(database), {
      [`liveGames/${pin}/status`]: 'countdown',
      [`liveGames/${pin}/nextQuestionIndex`]: nextQuestionIndex,
      [`liveGames/${pin}/countdownEndsAt`]: countdownEndsAt,
      [`gameStatus/${pin}/status`]: 'countdown',
    })
  } catch (error) {
    throw new Error(`Could not start the next-question countdown: ${formatRealtimeError(error)}`)
  }
}

export async function submitAnswer(
  pin: string,
  participantUid: string,
  optionIndex: number,
): Promise<void> {
  if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex > 3) {
    throw new Error('Choose one of the four answer options.')
  }
  const user = getConfiguredAuth().currentUser
  if (!user || user.uid !== participantUid || !user.isAnonymous) {
    throw new Error('Your participant session is not valid. Rejoin this game and try again.')
  }

  const database = await getRealtimeDatabase()
  const status = await get(ref(database, `liveGames/${pin}/status`))
  if (status.val() !== 'question') {
    throw new Error('This question is closed. Wait for the host to continue.')
  }
  const participant = await get(ref(database, `liveGames/${pin}/participants/${participantUid}`))
  if (!participant.exists()) throw new Error('Your participant session was not found.')
  const answersReference = ref(database, `gameAnswers/${pin}/${participantUid}`)
  const result = await runTransaction(
    answersReference,
    (currentValue) =>
      currentValue === null
        ? { optionIndex, submittedAt: serverTimestamp() }
        : undefined,
    { applyLocally: false },
  )
  if (!result.committed) {
    throw new Error('Your answer has already been submitted for this question.')
  }
}

export async function closeQuestion(pin: string, hostUid: string): Promise<void> {
  const host = auth?.currentUser
  if (!host || host.uid !== hostUid || host.isAnonymous) {
    throw new Error('Your host session expired. Sign in again before closing the question.')
  }
  const database = await getRealtimeDatabase()
  const gameReference = ref(database, `liveGames/${pin}`)
  const gameSnapshot = await get(gameReference)
  if (!gameSnapshot.exists() || gameSnapshot.child('hostUid').val() !== hostUid) {
    throw new Error('You are not the host of this game.')
  }
  if (gameSnapshot.child('status').val() === 'answerReview' && gameSnapshot.child('answerReveal').exists()) {
    return
  }
  if (!['question', 'answerReview'].includes(String(gameSnapshot.child('status').val()))) {
    throw new Error('There is no open question to close.')
  }

  const questionIndex: unknown = gameSnapshot.child('currentQuestion/index').val()
  if (typeof questionIndex !== 'number' || !Number.isInteger(questionIndex)) {
    throw new Error('The active question number is invalid.')
  }
  const question = (await getQuiz(String(gameSnapshot.child('quizId').val())))?.questions[questionIndex]
  if (!question) throw new Error('The active quiz question could not be verified.')

  if (gameSnapshot.child('status').val() === 'question') {
    await update(ref(database), {
      [`liveGames/${pin}/status`]: 'answerReview',
      [`gameStatus/${pin}/status`]: 'answerReview',
    })
  }

  const participants = gameSnapshot.child('participants').val() ?? {}
  const serverOffset = await getServerTimeOffset(database).catch((error: unknown) => {
    throw new Error(`Could not read server time: ${formatRealtimeError(error)}`)
  })
  let scoreSnapshots
  try {
    scoreSnapshots = await Promise.all(
      Object.keys(participants).map((uid) => get(ref(database, `gameAnswers/${pin}/${uid}`))),
    )
  } catch (error) {
    throw new Error(`Could not read participant answers: ${formatRealtimeError(error)}`)
  }
  const serverNow = Date.now() + serverOffset
  const startedAt: unknown = gameSnapshot.child('currentQuestion/startedAt').val()
  if (typeof startedAt !== 'number' || !Number.isFinite(startedAt)) {
    throw new Error('The active question start time is invalid.')
  }
  const deadline = startedAt + question.timeLimit * 1000
  const updates: Record<string, unknown> = {}
  let previousScoreSnapshots
  try {
    previousScoreSnapshots = await Promise.all(
      Object.keys(participants).map((uid) => get(ref(database, `liveScores/${pin}/${uid}`))),
    )
  } catch (error) {
    throw new Error(`Could not read existing scores: ${formatRealtimeError(error)}`)
  }

  for (const [index, uid] of Object.keys(participants).entries()) {
    const previousValue: unknown = previousScoreSnapshots[index].val()
    const previous = isRecord(previousValue) ? previousValue : {}
    const previousQuestions = isRecord(previous.questionScores) ? previous.questionScores : {}
    const answerValue: unknown = scoreSnapshots[index].val()
    const answer = isRecord(answerValue) ? answerValue : null
    const optionIndex = answer?.optionIndex
    const submittedAt = answer?.submittedAt
    let points = 0
    if (
      answer &&
      Number.isInteger(optionIndex) &&
      typeof submittedAt === 'number' &&
      Number.isFinite(submittedAt) &&
      submittedAt >= startedAt &&
      submittedAt <= Math.min(deadline, serverNow + 1000) &&
      optionIndex === question.correctIndex
    ) {
      const answerTime = Math.max(startedAt, Math.min(submittedAt, serverNow))
      const speedBonus = Math.max(0, deadline - answerTime) / (question.timeLimit * 1000)
      points = Math.round(question.points * (0.5 + 0.5 * speedBonus))
    }

    const storedQuestionPoints: unknown = previousQuestions[String(questionIndex)]
    const priorQuestionPoints = typeof storedQuestionPoints === 'number' ? storedQuestionPoints : 0
    const nickname = gameSnapshot.child(`participants/${uid}/nickname`).val()
    updates[`liveScores/${pin}/${uid}`] = {
      uid,
      nickname,
      totalPoints: Math.max(0, Number(previous.totalPoints) || 0) + points - priorQuestionPoints,
      lastQuestionPoints: points,
      questionScores: { ...previousQuestions, [questionIndex]: points },
    }
  }

  try {
    await update(ref(database), {
      ...updates,
      [`liveGames/${pin}/answerReveal`]: { correctIndex: question.correctIndex },
    })
  } catch (error) {
    throw new Error(`Could not publish scores and answer reveal: ${formatRealtimeError(error)}`)
  }
}

export async function endLiveGame(pin: string, hostUid: string): Promise<void> {
  const host = auth?.currentUser
  if (!host || host.uid !== hostUid || host.isAnonymous) {
    throw new Error('Your host session expired. Sign in again before ending the game.')
  }
  const database = await getRealtimeDatabase()
  const gameSnapshot = await get(ref(database, `liveGames/${pin}`))
  if (!gameSnapshot.exists() || gameSnapshot.child('hostUid').val() !== hostUid) {
    throw new Error('You are not the host of this game.')
  }
  if (
    gameSnapshot.child('status').val() !== 'answerReview' ||
    !gameSnapshot.child('answerReveal').exists() ||
    gameSnapshot.child('currentQuestion/index').val() !== gameSnapshot.child('totalQuestions').val() - 1
  ) {
    throw new Error('Finish and reveal the final question before ending the game.')
  }

  const participants = gameSnapshot.child('participants').val() ?? {}
  const scoreSnapshots = await Promise.all(
    Object.keys(participants).map((uid) => get(ref(database, `liveScores/${pin}/${uid}`))),
  )
  const standings = Object.keys(participants)
    .map((uid, index) => {
      const value: unknown = scoreSnapshots[index].val()
      const score = isRecord(value) ? value : {}
      return {
        uid,
        nickname: participants[uid].nickname,
        totalPoints: Number(score.totalPoints) || 0,
        questionScores: isRecord(score.questionScores) ? score.questionScores : {},
      }
    })
    .sort((a, b) => b.totalPoints - a.totalPoints || a.nickname.localeCompare(b.nickname))
    .map((standing, index) => ({ ...standing, rank: index + 1 }))

  const resultId = `${pin}-${gameSnapshot.child('createdAt').val()}`
  const firestore = await getDatabase()
  const { doc, serverTimestamp: firestoreServerTimestamp, setDoc } = await import('firebase/firestore')
  try {
    await setDoc(doc(firestore, 'gameResults', resultId), {
      pin,
      hostUid,
      quizId: gameSnapshot.child('quizId').val(),
      quizTitle: gameSnapshot.child('title').val(),
      participantUids: Object.keys(participants),
      standings,
      totalQuestions: gameSnapshot.child('totalQuestions').val(),
      createdAt: gameSnapshot.child('createdAt').val(),
      endedAt: firestoreServerTimestamp(),
    })
  } catch (error) {
    throw new Error(`Could not save final results to Firestore: ${getErrorCode(error) || (error instanceof Error ? error.message : 'Unknown error')}`)
  }
  try {
    await update(ref(database), {
      [`liveGames/${pin}/status`]: 'ended',
      [`liveGames/${pin}/resultId`]: resultId,
      [`gameStatus/${pin}/status`]: 'ended',
    })
  } catch (error) {
    throw new Error(`Results were saved, but could not mark the Realtime Database game ended: ${formatRealtimeError(error)}`)
  }
}

export async function revealFinalLeaderboard(pin: string, hostUid: string): Promise<void> {
  const host = auth?.currentUser
  if (!host || host.uid !== hostUid || host.isAnonymous) {
    throw new Error('Your host session expired. Sign in again before showing the leaderboard.')
  }
  const database = await getRealtimeDatabase()
  const gameReference = ref(database, `liveGames/${pin}`)
  const gameSnapshot = await get(gameReference)
  if (!gameSnapshot.exists() || gameSnapshot.child('hostUid').val() !== hostUid) {
    throw new Error('You are not the host of this game.')
  }
  if (gameSnapshot.child('status').val() === 'leaderboard') return
  if (
    gameSnapshot.child('status').val() !== 'ended' ||
    typeof gameSnapshot.child('resultId').val() !== 'string'
  ) {
    throw new Error('Finish the game and save its final results before showing the leaderboard.')
  }

  try {
    await update(ref(database), {
      [`liveGames/${pin}/status`]: 'leaderboard',
      [`gameStatus/${pin}/status`]: 'leaderboard',
    })
  } catch (error) {
    throw new Error(`Could not show the final leaderboard: ${formatRealtimeError(error)}`)
  }
}

export function watchServerTime(onTick: (serverTime: number) => void): () => void {
  let unsubscribe: (() => void) | undefined
  let interval: number | undefined
  let cancelled = false
  let offset = 0

  void getRealtimeDatabase()
    .then((database) => {
      if (cancelled) return
      unsubscribe = onValue(
        ref(database, '.info/serverTimeOffset'),
        (snapshot) => {
          offset = typeof snapshot.val() === 'number' ? snapshot.val() : 0
          onTick(Date.now() + offset)
        },
        () => onTick(Date.now() + offset),
      )
      interval = window.setInterval(() => onTick(Date.now() + offset), 250)
    })
    .catch(() => onTick(Date.now()))

  return () => {
    cancelled = true
    unsubscribe?.()
    if (interval !== undefined) window.clearInterval(interval)
  }
}

export function watchSubmittedAnswers(
  pin: string,
  participantUids: string[],
  onAnswers: (answers: Record<string, number>) => void,
  onError: (message: string) => void,
): () => void {
  let cancelled = false
  const unsubscribers: Array<() => void> = []
  const answers: Record<string, number> = {}

  void getRealtimeDatabase()
    .then((database) => {
      if (cancelled) return
      for (const uid of participantUids) {
        const unsubscribe = onValue(
          ref(database, `gameAnswers/${pin}/${uid}`),
          (snapshot) => {
            const value: unknown = snapshot.val()
            if (isRecord(value) && typeof value.optionIndex === 'number') {
              answers[uid] = value.optionIndex
            } else {
              delete answers[uid]
            }
            onAnswers({ ...answers })
          },
          (error) => onError(formatRealtimeError(error)),
        )
        unsubscribers.push(unsubscribe)
      }
    })
    .catch((error: unknown) => onError(formatRealtimeError(error)))

  return () => {
    cancelled = true
    unsubscribers.forEach((unsubscribe) => unsubscribe())
  }
}

export function watchLiveScores(
  pin: string,
  onScores: (scores: LiveScore[]) => void,
  onError: (message: string) => void,
): () => void {
  let unsubscribe: (() => void) | undefined
  let cancelled = false

  void getRealtimeDatabase()
    .then((database) => {
      if (cancelled) return
      unsubscribe = onValue(
        ref(database, `liveScores/${pin}`),
        (snapshot) => {
          const value: unknown = snapshot.val()
          if (!isRecord(value)) {
            onScores([])
            return
          }
          const scores = Object.values(value).filter(
            (score): score is LiveScore =>
              isRecord(score) &&
              typeof score.uid === 'string' &&
              typeof score.nickname === 'string' &&
              typeof score.totalPoints === 'number' &&
              typeof score.lastQuestionPoints === 'number' &&
              isRecord(score.questionScores) &&
              Object.values(score.questionScores).every((points) => typeof points === 'number'),
          )
          onScores(scores)
        },
        (error) => onError(formatRealtimeError(error)),
      )
    })
    .catch((error: unknown) => onError(formatRealtimeError(error)))

  return () => {
    cancelled = true
    unsubscribe?.()
  }
}

export function watchLiveGame(
  pin: string,
  onGame: (game: LiveGame | null) => void,
  onError: (message: string) => void,
): () => void {
  let unsubscribe: (() => void) | undefined
  let cancelled = false

  void getRealtimeDatabase()
    .then((database) => {
      if (cancelled) return
      const gameReference: DatabaseReference = ref(database, `liveGames/${pin}`)
      unsubscribe = onValue(
        gameReference,
        (snapshot) => {
          try {
            onGame(snapshot.exists() ? parseGame(pin, snapshot.val()) : null)
          } catch (error) {
            onError(formatRealtimeError(error))
          }
        },
        (error) => onError(formatRealtimeError(error)),
      )
    })
    .catch((error: unknown) => onError(formatRealtimeError(error)))

  return () => {
    cancelled = true
    unsubscribe?.()
  }
}

export function watchParticipantAnswer(
  pin: string,
  participantUid: string,
  onAnswer: (optionIndex: number | null) => void,
  onError: (message: string) => void,
): () => void {
  let unsubscribe: (() => void) | undefined
  let cancelled = false

  void getRealtimeDatabase()
    .then((database) => {
      if (cancelled) return
      unsubscribe = onValue(
        ref(database, `gameAnswers/${pin}/${participantUid}`),
        (snapshot) => {
          const value: unknown = snapshot.val()
          onAnswer(
            isRecord(value) && typeof value.optionIndex === 'number'
              ? value.optionIndex
              : null,
          )
        },
        (error) => onError(formatRealtimeError(error)),
      )
    })
    .catch((error: unknown) => onError(formatRealtimeError(error)))

  return () => {
    cancelled = true
    unsubscribe?.()
  }
}

export function getLiveGameErrorMessage(error: unknown) {
  return formatRealtimeError(error)
}
