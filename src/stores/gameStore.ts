import { create } from 'zustand'
import type { GameRound, GamePhase, GameMode } from '@/types/game'

interface GameStore {
  currentRound: GameRound | null
  phase: GamePhase
  selectedMode: GameMode
  timeLeft: number
  autoStart: boolean

  setCurrentRound: (round: GameRound) => void
  setPhase: (phase: GamePhase) => void
  setSelectedMode: (mode: GameMode) => void
  setTimeLeft: (seconds: number) => void
  setAutoStart: (value: boolean) => void
  reset: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  currentRound: null,
  phase: 'waiting',
  selectedMode: 'sentences',
  timeLeft: 0,
  autoStart: false,

  setCurrentRound: (round) => set({ currentRound: round }),
  setPhase: (phase) => set({ phase }),
  setSelectedMode: (mode) => set({ selectedMode: mode }),
  setTimeLeft: (seconds) => set({ timeLeft: seconds }),
  setAutoStart: (value) => set({ autoStart: value }),
  reset: () =>
    set({
      currentRound: null,
      phase: 'waiting',
      timeLeft: 0,
    }),
}))
