export type GameMode = 'words' | 'sentences' | 'text' | 'mixed'
export type GamePhase = 'waiting' | 'active' | 'results'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type SortColumn = 'name' | 'wpm' | 'accuracy' | 'progress'
export type SortOrder = 'asc' | 'desc'

export interface Player {
  id: string // = auth.users.id (uuid)
  name: string
  isAnonymous: boolean
}

export interface Competitor {
  player: Player
  typedText: string
  wpm: number
  accuracy: number
  isCompleted: boolean
}

export interface GameRound {
  id: string
  sentenceText: string
  mode: GameMode
  startedAt: string
  endedAt: string
}

export interface RoundResult {
  id: string
  roundId: string
  playerId: string
  wpm: number
  accuracy: number
  completed: boolean
}

export interface TableState {
  sortColumn: SortColumn
  sortOrder: SortOrder
  pageSize: number
  page: number
}
