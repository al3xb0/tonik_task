'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useGameStore } from '@/stores/gameStore'
import { toast } from 'sonner'
import type { GameRound } from '@/types/game'

const RESULTS_DURATION = 5000

export function useGameRound({ enabled = true }: { enabled?: boolean } = {}) {
  const {
    currentRound,
    phase,
    selectedMode,
    autoStart,
    setCurrentRound,
    setPhase,
    setTimeLeft,
    setAutoStart,
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
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.error('Failed to fetch round:', res.status, body)
        toast.error(body.error || `Failed to load round (${res.status})`)
        return
      }

      const round: GameRound = await res.json()
      setCurrentRound(round)

      const now = Date.now()
      const endedAt = new Date(round.endedAt).getTime()
      const remaining = Math.max(0, Math.ceil((endedAt - now) / 1000))

      setTimeLeft(remaining)

      if (remaining > 0) {
        setPhase('active')
        toast.success('Round started!', { duration: 2000 })
      }
    } catch (err) {
      console.error('Network error fetching round:', err)
      toast.error('Network error — could not load round')
    } finally {
      fetchingRef.current = false
    }
  }, [selectedMode, setCurrentRound, setPhase, setTimeLeft])

  const startRound = useCallback(() => {
    setAutoStart(true)
    fetchRound()
  }, [setAutoStart, fetchRound])

  const exitRound = useCallback(() => {
    clearTimers()
    setAutoStart(false)
    reset()
  }, [clearTimers, setAutoStart, reset])

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
    if (!autoStart) return

    resultsTimeoutRef.current = setTimeout(() => {
      reset()
      fetchRound()
    }, RESULTS_DURATION)

    return () => {
      if (resultsTimeoutRef.current) {
        clearTimeout(resultsTimeoutRef.current)
        resultsTimeoutRef.current = null
      }
    }
  }, [phase, autoStart, reset, fetchRound])

  useEffect(() => {
    if (!enabled) return

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
        () => {
          if (autoStart) {
            clearTimers()
            fetchRound()
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [enabled, autoStart, clearTimers, fetchRound])

  return { currentRound, phase, startRound, exitRound }
}
