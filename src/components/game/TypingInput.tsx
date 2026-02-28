'use client'

import { useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { createRoundChannel, sendTypingUpdate } from '@/lib/supabase/realtime'
import { useTypingMetrics } from '@/hooks/useTypingMetrics'
import { useGameStore } from '@/stores/gameStore'
import { usePlayerStore } from '@/stores/playerStore'
import type { RealtimeChannel } from '@supabase/supabase-js'

function throttle<Args extends unknown[]>(
  fn: (...args: Args) => void,
  ms: number,
): ((...args: Args) => void) & { cancel: () => void } {
  let lastCall = 0
  let timer: ReturnType<typeof setTimeout> | null = null

  const throttled = (...args: Args) => {
    const now = Date.now()
    const remaining = ms - (now - lastCall)

    if (remaining <= 0) {
      lastCall = now
      fn(...args)
    } else if (!timer) {
      timer = setTimeout(() => {
        lastCall = Date.now()
        timer = null
        fn(...args)
      }, remaining)
    }
  }

  throttled.cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  return throttled
}

const charStateClasses: Record<string, string> = {
  correct: 'text-green-600 dark:text-green-400',
  incorrect: 'text-red-500 underline decoration-red-500',
  current: 'border-l-2 border-primary animate-pulse',
  pending: 'text-muted-foreground/50',
}

export function TypingInput() {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const resultSavedRef = useRef(false)

  const { currentRound, phase } = useGameStore()
  const { localPlayer } = usePlayerStore()
  const { upsertCompetitor } = usePlayerStore()

  const targetText = currentRound?.sentenceText ?? ''
  const isActive = phase === 'active'

  const {
    typedText,
    charStates,
    wpm,
    accuracy,
    isCompleted,
    handleInput,
    reset,
  } = useTypingMetrics({ targetText, enabled: isActive })

  useEffect(() => {
    if (!currentRound) return

    const supabase = createClient()
    const channel = createRoundChannel(supabase, currentRound.id)
    channel.subscribe()
    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [currentRound?.id])

  const throttledBroadcast = useCallback(
    throttle(
      (payload: {
        playerId: string
        playerName: string
        typedText: string
        wpm: number
        accuracy: number
        isCompleted: boolean
      }) => {
        if (channelRef.current) {
          sendTypingUpdate(channelRef.current, payload)
        }
      },
      300,
    ),
    [],
  )

  useEffect(() => {
    return () => {
      throttledBroadcast.cancel()
    }
  }, [throttledBroadcast])

  useEffect(() => {
    if (!localPlayer || !isActive) return

    upsertCompetitor({
      playerId: localPlayer.id,
      playerName: localPlayer.name,
      typedText,
      wpm,
      accuracy,
      isCompleted,
    })

    throttledBroadcast({
      playerId: localPlayer.id,
      playerName: localPlayer.name,
      typedText,
      wpm,
      accuracy,
      isCompleted,
    })
  }, [typedText, wpm, accuracy, isCompleted])

  useEffect(() => {
    if (!isCompleted || !currentRound || !localPlayer || resultSavedRef.current)
      return

    resultSavedRef.current = true
    const supabase = createClient()
    supabase.from('round_results').upsert(
      {
        round_id: currentRound.id,
        player_id: localPlayer.id,
        wpm: Math.round(wpm),
        accuracy: parseFloat(accuracy.toFixed(4)),
        completed: true,
      },
      { onConflict: 'round_id,player_id' },
    ).then(({ error }) => {
      if (error) console.error('Failed to save result:', error)
    })
  }, [isCompleted, currentRound, localPlayer, wpm, accuracy])

  useEffect(() => {
    if (phase !== 'results' || !currentRound || !localPlayer || resultSavedRef.current)
      return
    if (typedText.length === 0) return

    resultSavedRef.current = true
    const supabase = createClient()
    supabase.from('round_results').upsert(
      {
        round_id: currentRound.id,
        player_id: localPlayer.id,
        wpm: Math.round(wpm),
        accuracy: parseFloat(accuracy.toFixed(4)),
        completed: isCompleted,
      },
      { onConflict: 'round_id,player_id' },
    ).then(({ error }) => {
      if (error) console.error('Failed to save timeout result:', error)
    })
  }, [phase])

  useEffect(() => {
    resultSavedRef.current = false
    reset()
  }, [currentRound?.id])

  useEffect(() => {
    if (isActive && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isActive])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInput(e.target.value)
  }

  const handleOverlayClick = () => {
    if (isActive && textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  return (
    <div className="relative w-full" data-testid="typing-input">
      <div
        className="rounded-lg border bg-card p-6 font-mono text-lg leading-relaxed cursor-text min-h-30 select-none"
        onClick={handleOverlayClick}
      >
        {!targetText && (
          <span className="text-muted-foreground">Waiting for round...</span>
        )}
        {targetText.split('').map((char, i) => {
          const state = charStates[i] ?? 'pending'
          return (
            <span key={i} className={charStateClasses[state]}>
              {char}
            </span>
          )
        })}
      </div>

      <textarea
        ref={textareaRef}
        value={typedText}
        onChange={handleChange}
        disabled={!isActive || isCompleted}
        className="absolute inset-0 opacity-0 resize-none cursor-default"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-testid="typing-textarea"
      />

      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm"
          >
            <div className="text-center">
              <motion.p
                initial={{ y: 10 }}
                animate={{ y: 0 }}
                className="text-2xl font-bold text-green-500"
              >
                Completed!
              </motion.p>
              <p className="text-muted-foreground mt-1">
                {wpm} WPM &middot; {(accuracy * 100).toFixed(1)}% accuracy
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
