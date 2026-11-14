import type { ParticipantAvatarId } from '../utils/participantAvatars'

export interface LiveParticipant {
  uid: string
  nickname: string
  nicknameKey: string
  joinedAt: number
  connected: boolean
  avatarId?: ParticipantAvatarId
}

export interface LiveGame {
  pin: string
  hostUid: string
  quizId: string
  title: string
  status: 'lobby' | 'question' | 'answerReview' | 'countdown' | 'leaderboard' | 'ended'
  lateJoining: boolean
  createdAt: number
  totalQuestions: number
  participants: Record<string, LiveParticipant>
  currentQuestion?: LiveQuestion | null
  answerReveal?: { correctIndex: number } | null
  nextQuestionIndex?: number
  countdownEndsAt?: number
  resultId?: string
}

export interface LiveQuestion {
  index: number
  prompt: string
  options: [string, string, string, string]
  imageUrl: string
  timeLimit: number
  startedAt: number
}

export interface LiveScore {
  uid: string
  nickname: string
  avatarId?: ParticipantAvatarId
  totalPoints: number
  lastQuestionPoints: number
  questionScores: Record<string, number>
}
