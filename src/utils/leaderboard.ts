import type { LiveScore } from '../types/game'

export function rankLiveScores(scores: LiveScore[]) {
  return [...scores].sort(
    (a, b) => b.totalPoints - a.totalPoints || a.nickname.localeCompare(b.nickname),
  )
}
