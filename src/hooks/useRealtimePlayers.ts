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

  useEffect(() => {
    if (!currentRound) return

    if (prevRoundIdRef.current && prevRoundIdRef.current !== currentRound.id) {
      clearCompetitors()
    }
    prevRoundIdRef.current = currentRound.id

    const supabase = createClient()
    const channel = createRoundChannel(supabase, currentRound.id)

    onTypingUpdate(channel, (payload) => {
      if (payload.playerId === localPlayer?.id) return
      upsertCompetitor({
        playerId: payload.playerId,
        playerName: payload.playerName,
        typedText: payload.typedText,
        wpm: payload.wpm,
        accuracy: payload.accuracy,
        isCompleted: payload.isCompleted,
      })
    })

    channel.subscribe()
    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [currentRound?.id])

  useEffect(() => {
    if (!currentRound) {
      clearCompetitors()
    }
  }, [currentRound])
}
