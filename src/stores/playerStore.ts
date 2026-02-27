import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Player, Competitor, TableState } from '@/types/game'

interface PlayerStore {
  localPlayer: Player | null
  competitors: Competitor[]
  tableSort: TableState

  setLocalPlayer: (player: Player) => void
  upsertCompetitor: (update: { playerId: string } & Partial<Omit<Competitor, 'player'>> & { playerName?: string }) => void
  removeCompetitor: (playerId: string) => void
  setTableSort: (sort: Partial<TableState>) => void
  clearCompetitors: () => void
}

const defaultTableSort: TableState = {
  sortColumn: 'wpm',
  sortOrder: 'desc',
  pageSize: 10,
  page: 1,
}

export const usePlayerStore = create<PlayerStore>()(
  persist(
    (set) => ({
      localPlayer: null,
      competitors: [],
      tableSort: defaultTableSort,

      setLocalPlayer: (player) => set({ localPlayer: player }),

      upsertCompetitor: (update) =>
        set((state) => {
          const existingIndex = state.competitors.findIndex(
            (c) => c.player.id === update.playerId,
          )

          if (existingIndex >= 0) {
            const updated = [...state.competitors]
            updated[existingIndex] = {
              ...updated[existingIndex],
              ...(update.typedText !== undefined && { typedText: update.typedText }),
              ...(update.wpm !== undefined && { wpm: update.wpm }),
              ...(update.accuracy !== undefined && { accuracy: update.accuracy }),
              ...(update.isCompleted !== undefined && { isCompleted: update.isCompleted }),
              ...(update.playerName !== undefined && {
                player: { ...updated[existingIndex].player, name: update.playerName },
              }),
            }
            return { competitors: updated }
          }

          const newCompetitor: Competitor = {
            player: {
              id: update.playerId,
              name: update.playerName ?? 'Anonymous',
              isAnonymous: true,
            },
            typedText: update.typedText ?? '',
            wpm: update.wpm ?? 0,
            accuracy: update.accuracy ?? 1,
            isCompleted: update.isCompleted ?? false,
          }
          return { competitors: [...state.competitors, newCompetitor] }
        }),

      removeCompetitor: (playerId) =>
        set((state) => ({
          competitors: state.competitors.filter((c) => c.player.id !== playerId),
        })),

      setTableSort: (sort) =>
        set((state) => ({
          tableSort: { ...state.tableSort, ...sort },
        })),

      clearCompetitors: () => set({ competitors: [] }),
    }),
    {
      name: 'typeracer-player-settings',
      partialize: (state) => ({ tableSort: state.tableSort }),
    },
  ),
)
