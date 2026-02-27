import { create } from 'zustand'
import type { GameRound, GamePhase, GameMode } from '@/types/game'

interface GameStore {
  currentRound: GameRound | null
  phase: GamePhase
  selectedMode: GameMode
  timeLeft: number

  setCurrentRound: (round: GameRound) => void
  setPhase: (phase: GamePhase) => void
  setSelectedMode: (mode: GameMode) => void
  setTimeLeft: (seconds: number) => void
  reset: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  currentRound: null,
  phase: 'waiting',
  selectedMode: 'sentences',
  timeLeft: 0,

  setCurrentRound: (round) => set({ currentRound: round }),
  setPhase: (phase) => set({ phase }),
  setSelectedMode: (mode) => set({ selectedMode: mode }),
  setTimeLeft: (seconds) => set({ timeLeft: seconds }),
  reset: () =>
    set({
      currentRound: null,
      phase: 'waiting',
      timeLeft: 0,
    }),
}))
