export interface QuizQuestion {
  prompt: string
  options: [string, string, string, string]
  correctIndex: number
  timeLimit: number
  points: number
  imageUrl: string
}

export interface Quiz {
  id: string
  hostId: string
  title: string
  description: string
  questions: QuizQuestion[]
  createdAt: number
  updatedAt: number
}

export type QuizInput = Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>

export function createEmptyQuestion(): QuizQuestion {
  return {
    prompt: '',
    options: ['', '', '', ''],
    correctIndex: 0,
    timeLimit: 20,
    points: 1000,
    imageUrl: '',
  }
}
