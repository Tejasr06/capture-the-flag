import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { getDatabase } from './firebase'
import type { Quiz, QuizInput, QuizQuestion } from '../types/quiz'

function normalizeQuestion(value: unknown): QuizQuestion {
  if (!value || typeof value !== 'object') {
    throw new Error('This quiz contains an invalid question. Try editing or recreating it.')
  }

  const question = value as Partial<QuizQuestion>
  if (
    typeof question.prompt !== 'string' ||
    !Array.isArray(question.options) ||
    question.options.length !== 4 ||
    !question.options.every((option) => typeof option === 'string') ||
    !Number.isInteger(question.correctIndex) ||
    question.correctIndex < 0 ||
    question.correctIndex > 3 ||
    typeof question.timeLimit !== 'number' ||
    typeof question.imageUrl !== 'string'
  ) {
    throw new Error('This quiz contains an invalid question. Try editing or recreating it.')
  }
  const points = question.points ?? 1000
  if (!Number.isInteger(points) || points < 100 || points > 5000) {
    throw new Error('This quiz contains an invalid point value. Choose between 100 and 5,000 points.')
  }

  return {
    prompt: question.prompt,
    options: question.options as QuizQuestion['options'],
    correctIndex: question.correctIndex,
    timeLimit: question.timeLimit,
    points,
    imageUrl: question.imageUrl,
  }
}

function toQuiz(id: string, value: Record<string, unknown>): Quiz {
  if (
    typeof value.hostId !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.description !== 'string' ||
    !Array.isArray(value.questions)
  ) {
    throw new Error('This quiz has invalid data. Try refreshing or contact support.')
  }

  const getMillis = (date: unknown) =>
    date && typeof date === 'object' && 'toMillis' in date && typeof date.toMillis === 'function'
      ? date.toMillis()
      : Date.now()

  return {
    id,
    hostId: value.hostId,
    title: value.title,
    description: value.description,
    questions: value.questions.map(normalizeQuestion),
    createdAt: getMillis(value.createdAt),
    updatedAt: getMillis(value.updatedAt),
  }
}

export async function listHostQuizzes(hostId: string): Promise<Quiz[]> {
  const database = await getDatabase()
  const quizzesQuery = query(
    collection(database, 'quizzes'),
    where('hostId', '==', hostId),
  )
  const snapshot = await getDocs(quizzesQuery)
  return snapshot.docs
    .map((quizDoc) => toQuiz(quizDoc.id, quizDoc.data()))
    .sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getQuiz(quizId: string): Promise<Quiz | null> {
  const database = await getDatabase()
  const snapshot = await getDoc(doc(database, 'quizzes', quizId))
  return snapshot.exists() ? toQuiz(snapshot.id, snapshot.data()) : null
}

export async function createQuiz(input: QuizInput): Promise<string> {
  const database = await getDatabase()
  const reference = await addDoc(collection(database, 'quizzes'), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return reference.id
}

export async function updateQuiz(quizId: string, input: QuizInput): Promise<void> {
  const database = await getDatabase()
  await updateDoc(doc(database, 'quizzes', quizId), {
    ...input,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteQuiz(quizId: string): Promise<void> {
  const database = await getDatabase()
  await deleteDoc(doc(database, 'quizzes', quizId))
}

export function getQuizErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Something went wrong while accessing your quizzes. Please try again.'
  }

  const code = 'code' in error && typeof error.code === 'string' ? error.code : ''
  if (code === 'permission-denied' || code === 'firestore/permission-denied') {
    return 'Firestore denied this request. Confirm Firestore is created and the QuizArena security rules are published.'
  }
  if (code === 'failed-precondition' || code === 'firestore/failed-precondition') {
    return 'Firestore is not ready yet. Create the database in the Firebase Console and publish the QuizArena rules.'
  }
  if (code === 'unavailable' || code === 'firestore/unavailable') {
    return 'Could not reach Firebase. Check your internet connection and try again.'
  }

  return error.message
}
