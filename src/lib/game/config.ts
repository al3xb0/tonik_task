import type { GameMode } from '@/types/game'

export const DURATION_BY_MODE: Record<GameMode, number> = {
  words: 30,
  sentences: 60,
  text: 90,
  mixed: 60,
}
