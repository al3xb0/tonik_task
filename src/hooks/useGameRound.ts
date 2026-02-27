'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useGameStore } from '@/stores/gameStore'
import type { GameRound } from '@/types/game'

const RESULTS_DURATION = 5000

export function useGameRound() {
  const {
    currentRound,
    phase,
    selectedMode,
    setCurrentRound,
    setPhase,
    setTimeLeft,
    reset,
  } = useGameStore()

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const resultsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fetchingRef = useRef(false)

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (resultsTimeoutRef.current) {
      clearTimeout(resultsTimeoutRef.current)
      resultsTimeoutRef.current = null
    }
  }, [])

  const fetchRound = useCallback(async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true

    try {
      const res = await fetch(`/api/rounds?mode=${selectedMode}`)
      if (!res.ok) return

      const round: GameRound = await res.json()
      setCurrentRound(round)

      const now = Date.now()
      const endedAt = new Date(round.endedAt).getTime()
      const remaining = Math.max(0, Math.ceil((endedAt - now) / 1000))

      setTimeLeft(remaining)

      if (remaining > 0) {
        setPhase('active')
      }
    } finally {
      fetchingRef.current = false
    }
  }, [selectedMode, setCurrentRound, setPhase, setTimeLeft])

  const startNextRound = useCallback(() => {
    reset()
    fetchRound()
  }, [reset, fetchRound])

  useEffect(() => {
    fetchRound()
  }, [fetchRound])

  useEffect(() => {
    if (phase !== 'active' || !currentRound) return

    intervalRef.current = setInterval(() => {
      const now = Date.now()
      const endedAt = new Date(currentRound.endedAt).getTime()
      const remaining = Math.max(0, Math.ceil((endedAt - now) / 1000))

      setTimeLeft(remaining)

      if (remaining <= 0) {
        clearTimers()
        setPhase('results')
      }
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [phase, currentRound, setTimeLeft, setPhase, clearTimers])

  useEffect(() => {
    if (phase !== 'results') return

    resultsTimeoutRef.current = setTimeout(() => {
      startNextRound()
    }, RESULTS_DURATION)

    return () => {
      if (resultsTimeoutRef.current) {
        clearTimeout(resultsTimeoutRef.current)
        resultsTimeoutRef.current = null
      }
    }
  }, [phase, startNextRound])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('game_rounds_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_rounds',
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          const round: GameRound = {
            id: row.id as string,
            sentenceText: row.sentence_text as string,
            mode: row.mode as GameRound['mode'],
            startedAt: row.started_at as string,
            endedAt: row.ended_at as string,
          }

          const now = Date.now()
          const endedAt = new Date(round.endedAt).getTime()
          const remaining = Math.max(0, Math.ceil((endedAt - now) / 1000))

          if (remaining > 0) {
            clearTimers()
            setCurrentRound(round)
            setTimeLeft(remaining)
            setPhase('active')
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [clearTimers, setCurrentRound, setPhase, setTimeLeft])

  return { currentRound, phase }
}
