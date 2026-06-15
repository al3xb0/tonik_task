'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { acquireRoundChannel, releaseRoundChannel, onTypingUpdate } from '@/lib/supabase/realtime'
import { useGameStore } from '@/stores/gameStore'
import { usePlayerStore } from '@/stores/playerStore'

export function useRealtimePlayers() {
  const currentRound = useGameStore((s) => s.currentRound)
  const { upsertCompetitor, clearCompetitors, localPlayer } = usePlayerStore()
  const prevRoundIdRef = useRef<string | null>(null)

  const roundId = currentRound?.id
  const localPlayerId = localPlayer?.id

  useEffect(() => {
    if (!roundId) return

    if (prevRoundIdRef.current && prevRoundIdRef.current !== roundId) {
      clearCompetitors()
    }
    prevRoundIdRef.current = roundId

    const supabase = createClient()
    acquireRoundChannel(supabase, roundId)

    const unsubscribe = onTypingUpdate(roundId, (payload) => {
      if (payload.playerId === localPlayerId) return
      upsertCompetitor({
        playerId: payload.playerId,
        playerName: payload.playerName,
        typedText: payload.typedText,
        wpm: payload.wpm,
        accuracy: payload.accuracy,
        isCompleted: payload.isCompleted,
      })
    })

    return () => {
      unsubscribe()
      releaseRoundChannel(supabase, roundId)
    }
  }, [roundId, localPlayerId, clearCompetitors, upsertCompetitor])

  useEffect(() => {
    if (!currentRound) {
      clearCompetitors()
    }
  }, [currentRound, clearCompetitors])
}
