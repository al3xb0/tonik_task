'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createRoundChannel, onTypingUpdate } from '@/lib/supabase/realtime'
import { useGameStore } from '@/stores/gameStore'
import { usePlayerStore } from '@/stores/playerStore'

export function useRealtimePlayers() {
  const currentRound = useGameStore((s) => s.currentRound)
  const { upsertCompetitor, clearCompetitors, localPlayer } = usePlayerStore()
  const channelRef = useRef<ReturnType<typeof createRoundChannel> | null>(null)
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
    const channel = createRoundChannel(supabase, roundId)

    onTypingUpdate(channel, (payload) => {
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

    channel.subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR') {
        console.error('Realtime channel error:', err)
      } else if (status === 'TIMED_OUT') {
        console.warn('Realtime channel timed out, retrying...')
      }
    })
    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [roundId, localPlayerId, clearCompetitors, upsertCompetitor])

  useEffect(() => {
    if (!currentRound) {
      clearCompetitors()
    }
  }, [currentRound, clearCompetitors])
}
