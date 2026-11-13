const { randomInt } = require('node:crypto')
const { initializeApp } = require('firebase-admin/app')
const { getDatabase, ServerValue } = require('firebase-admin/database')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const logger = require('firebase-functions/logger')
const { HttpsError, onCall } = require('firebase-functions/v2/https')

initializeApp()

const database = getDatabase()
const firestore = getFirestore()

function requirePin(value) {
  if (typeof value !== 'string' || !/^\d{6}$/.test(value)) {
    throw new HttpsError('invalid-argument', 'Enter a valid six-digit Game PIN.')
  }
  return value
}

function requireHost(request, game) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in before controlling a live game.')
  }
  if (game.hostUid !== request.auth.uid) {
    throw new HttpsError('permission-denied', 'Only this game’s host can control it.')
  }
}

function requireAuthenticated(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in before controlling a live game.')
  }
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readQuestion(question) {
  if (
    !isRecord(question) ||
    typeof question.prompt !== 'string' ||
    !Array.isArray(question.options) ||
    question.options.length !== 4 ||
    !question.options.every((option) => typeof option === 'string') ||
    !Number.isInteger(question.correctIndex) ||
    question.correctIndex < 0 ||
    question.correctIndex > 3 ||
    !Number.isInteger(question.timeLimit) ||
    question.timeLimit < 5 ||
    question.timeLimit > 120 ||
    typeof question.imageUrl !== 'string'
  ) {
    throw new HttpsError('failed-precondition', 'The quiz question is incomplete or invalid.')
  }
  return question
}

async function loadGame(pin) {
  const snapshot = await database.ref(`liveGames/${pin}`).get()
  if (!snapshot.exists()) {
    throw new HttpsError('not-found', 'This live game no longer exists.')
  }
  return snapshot.val()
}

exports.createLiveGame = onCall(async (request) => {
  requireAuthenticated(request)
  const quizId = request.data?.quizId
  if (typeof quizId !== 'string' || quizId.length === 0) {
    throw new HttpsError('invalid-argument', 'Choose a quiz before starting a live game.')
  }

  const quizSnapshot = await firestore.collection('quizzes').doc(quizId).get()
  if (!quizSnapshot.exists || quizSnapshot.data().hostId !== request.auth.uid) {
    throw new HttpsError('permission-denied', 'You can only host your own quiz.')
  }
  const quiz = quizSnapshot.data()
  if (
    typeof quiz.title !== 'string' ||
    !Array.isArray(quiz.questions) ||
    quiz.questions.length < 1 ||
    quiz.questions.length > 50
  ) {
    throw new HttpsError('failed-precondition', 'This quiz has invalid data and cannot be started.')
  }
  const questions = quiz.questions.map(readQuestion)
  const game = {
    hostUid: request.auth.uid,
    quizId,
    title: quiz.title,
    status: 'lobby',
    lateJoining: false,
    createdAt: Date.now(),
    totalQuestions: questions.length,
  }

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const pin = String(randomInt(100000, 1000000))
    const reservation = await database.ref(`liveGames/${pin}`).transaction(
      (current) => (current === null ? game : undefined),
      undefined,
      false,
    )
    if (!reservation.committed) continue

    try {
      await database.ref().update({
        [`gameStatus/${pin}`]: { status: 'lobby', lateJoining: false },
        [`gameContent/${pin}/questions`]: questions,
      })
      return { pin }
    } catch (error) {
      logger.error('Failed to initialize the live game.', error)
      await Promise.all([
        database.ref(`liveGames/${pin}`).remove(),
        database.ref(`gameStatus/${pin}`).remove(),
        database.ref(`gameContent/${pin}`).remove(),
      ])
      throw new HttpsError('internal', 'The live game could not be initialized. Try again.')
    }
  }
  throw new HttpsError('resource-exhausted', 'Could not reserve a unique game PIN. Try again.')
})

exports.startQuestion = onCall(async (request) => {
  requireAuthenticated(request)
  const pin = requirePin(request.data?.pin)
  const game = await loadGame(pin)
  requireHost(request, game)

  const questionIndex = request.data?.questionIndex
  if (!Number.isInteger(questionIndex) || questionIndex < 0 || questionIndex >= game.totalQuestions) {
    throw new HttpsError('invalid-argument', 'That question number is invalid.')
  }
  const participantIds = Object.keys(game.participants || {})
  if (participantIds.length === 0) {
    throw new HttpsError('failed-precondition', 'At least one participant must join before the quiz starts.')
  }
  if (
    (game.status === 'lobby' && questionIndex !== 0) ||
    (game.status === 'answerReview' &&
      (questionIndex !== (game.currentQuestion?.index ?? -1) + 1 ||
        !isRecord(game.answerReveal)))
  ) {
    throw new HttpsError('failed-precondition', 'The game is not ready to start that question.')
  }
  if (game.status !== 'lobby' && game.status !== 'answerReview') {
    throw new HttpsError('failed-precondition', 'Close the current question before continuing.')
  }

  const questionSnapshot = await database.ref(`gameContent/${pin}/questions/${questionIndex}`).get()
  if (!questionSnapshot.exists()) {
    throw new HttpsError('failed-precondition', 'The question snapshot is missing.')
  }
  const question = readQuestion(questionSnapshot.val())
  const updates = {
    [`liveGames/${pin}/currentQuestion`]: {
      index: questionIndex,
      prompt: question.prompt,
      options: question.options,
      imageUrl: question.imageUrl,
      timeLimit: question.timeLimit,
      startedAt: ServerValue.TIMESTAMP,
    },
    [`liveGames/${pin}/answerReveal`]: null,
    [`liveGames/${pin}/status`]: 'question',
    [`gameStatus/${pin}/status`]: 'question',
    [`gameAnswers/${pin}`]: null,
  }
  await database.ref().update(updates)
  return { started: true }
})

exports.closeQuestion = onCall(async (request) => {
  requireAuthenticated(request)
  const pin = requirePin(request.data?.pin)
  const game = await loadGame(pin)
  requireHost(request, game)

  if (game.status === 'answerReview' && isRecord(game.answerReveal)) {
    return { closed: true }
  }
  if (
    (game.status !== 'question' &&
      !(game.status === 'answerReview' && !isRecord(game.answerReveal))) ||
    !isRecord(game.currentQuestion)
  ) {
    throw new HttpsError('failed-precondition', 'There is no open question to close.')
  }

  const questionIndex = game.currentQuestion.index
  if (!Number.isInteger(questionIndex) || questionIndex < 0 || questionIndex >= game.totalQuestions) {
    throw new HttpsError('failed-precondition', 'The active question is invalid.')
  }
  const questionSnapshot = await database.ref(`gameContent/${pin}/questions/${questionIndex}`).get()
  if (!questionSnapshot.exists()) {
    throw new HttpsError('failed-precondition', 'The question snapshot is missing.')
  }
  const question = readQuestion(questionSnapshot.val())
  const startedAt = game.currentQuestion.startedAt
  if (!Number.isFinite(startedAt)) {
    throw new HttpsError('failed-precondition', 'The active question timer is invalid.')
  }
  if (game.status === 'question') {
    await database.ref().update({
      [`liveGames/${pin}/status`]: 'answerReview',
      [`gameStatus/${pin}/status`]: 'answerReview',
    })
  }

  const [answersSnapshot, scoresSnapshot] = await Promise.all([
    database.ref(`gameAnswers/${pin}`).get(),
    database.ref(`liveScores/${pin}`).get(),
  ])
  const answers = answersSnapshot.val() || {}
  const existingScores = scoresSnapshot.val() || {}
  const deadline = startedAt + question.timeLimit * 1000
  const now = Date.now()
  const scoreUpdates = {}
  const participants = game.participants || {}

  for (const [uid, participant] of Object.entries(participants)) {
    const previous = existingScores[uid]
    const answer = answers[uid]
    let points = 0
    if (
      isRecord(answer) &&
      Number.isInteger(answer.optionIndex) &&
      answer.optionIndex >= 0 &&
      answer.optionIndex <= 3 &&
      Number.isFinite(answer.submittedAt) &&
      answer.submittedAt >= startedAt &&
      answer.submittedAt <= Math.min(deadline, now + 1000) &&
      answer.optionIndex === question.correctIndex
    ) {
      const scoredAt = Math.max(startedAt, Math.min(answer.submittedAt, now))
      const timeRemaining = Math.max(0, deadline - scoredAt)
      points = Math.round(500 + 500 * (timeRemaining / (question.timeLimit * 1000)))
    }

    const previousQuestionScores = isRecord(previous?.questionScores)
      ? previous.questionScores
      : {}
    scoreUpdates[`liveScores/${pin}/${uid}`] = {
      uid,
      nickname: participant.nickname,
      totalPoints: (Number.isFinite(previous?.totalPoints) ? previous.totalPoints : 0) + points,
      lastQuestionPoints: points,
      questionScores: {
        ...previousQuestionScores,
        [questionIndex]: points,
      },
    }
  }

  scoreUpdates[`liveGames/${pin}/answerReveal`] = { correctIndex: question.correctIndex }
  scoreUpdates[`liveGames/${pin}/status`] = 'answerReview'
  scoreUpdates[`gameStatus/${pin}/status`] = 'answerReview'
  await database.ref().update(scoreUpdates)
  return { closed: true }
})

exports.endLiveGame = onCall(async (request) => {
  requireAuthenticated(request)
  const pin = requirePin(request.data?.pin)
  const game = await loadGame(pin)
  requireHost(request, game)

  if (game.status === 'ended' && typeof game.resultId === 'string') {
    return { resultId: game.resultId }
  }
  if (
    game.status !== 'answerReview' ||
    game.currentQuestion?.index !== game.totalQuestions - 1 ||
    !isRecord(game.answerReveal)
  ) {
    throw new HttpsError('failed-precondition', 'Finish and review the final question before ending the game.')
  }

  const scoresSnapshot = await database.ref(`liveScores/${pin}`).get()
  const scores = scoresSnapshot.val() || {}
  const participants = game.participants || {}
  const standings = Object.values(participants)
    .map((participant) => {
      const score = scores[participant.uid]
      return {
        uid: participant.uid,
        nickname: participant.nickname,
        totalPoints: Number.isFinite(score?.totalPoints) ? score.totalPoints : 0,
        questionScores: isRecord(score?.questionScores) ? score.questionScores : {},
      }
    })
    .sort((a, b) => b.totalPoints - a.totalPoints || a.nickname.localeCompare(b.nickname))
    .map((standing, index) => ({ ...standing, rank: index + 1 }))

  const resultId = `${pin}-${game.createdAt}`
  await firestore.collection('gameResults').doc(resultId).set({
    pin,
    hostUid: game.hostUid,
    quizId: game.quizId,
    quizTitle: game.title,
    participantUids: Object.keys(participants),
    standings,
    totalQuestions: game.totalQuestions,
    createdAt: game.createdAt,
    endedAt: FieldValue.serverTimestamp(),
  })

  await database.ref().update({
    [`liveGames/${pin}/status`]: 'ended',
    [`liveGames/${pin}/resultId`]: resultId,
    [`gameStatus/${pin}/status`]: 'ended',
  })
  return { resultId }
})
