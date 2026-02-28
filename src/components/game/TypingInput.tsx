'use client'

import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { createRoundChannel, sendTypingUpdate } from '@/lib/supabase/realtime'
import { useTypingMetrics } from '@/hooks/useTypingMetrics'
import { useGameStore } from '@/stores/gameStore'
import { usePlayerStore } from '@/stores/playerStore'
import { toast } from 'sonner'
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

  const { typedText, charStates, wpm, accuracy, isCompleted, handleInput, reset } =
    useTypingMetrics({ targetText, enabled: isActive })

  const roundId = currentRound?.id

  useEffect(() => {
    if (!roundId) return

    const supabase = createClient()
    const channel = createRoundChannel(supabase, roundId)
    channel.subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR') {
        console.error('TypingInput channel error:', err)
      }
    })
    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [roundId])

  const throttledBroadcastRef = useRef<
    | (((payload: {
        playerId: string
        playerName: string
        typedText: string
        wpm: number
        accuracy: number
        isCompleted: boolean
      }) => void) & { cancel: () => void })
    | null
  >(null)

  useEffect(() => {
    const fn = throttle(
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
    )
    throttledBroadcastRef.current = fn
    return () => fn.cancel()
  }, [])

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

    throttledBroadcastRef.current?.({
      playerId: localPlayer.id,
      playerName: localPlayer.name,
      typedText,
      wpm,
      accuracy,
      isCompleted,
    })
  }, [
    typedText,
    wpm,
    accuracy,
    isCompleted,
    localPlayer,
    isActive,
    upsertCompetitor,
  ])

  useEffect(() => {
    if (!isCompleted || !currentRound || !localPlayer || resultSavedRef.current) return

    resultSavedRef.current = true
    toast.success('You completed the round!', { duration: 3000 })
    const supabase = createClient()
    supabase
      .from('round_results')
      .upsert(
        {
          round_id: currentRound.id,
          player_id: localPlayer.id,
          wpm: Math.round(wpm),
          accuracy: parseFloat(accuracy.toFixed(4)),
          completed: true,
        },
        { onConflict: 'round_id,player_id' },
      )
      .then(({ error }: { error: unknown }) => {
        if (error) console.error('Failed to save result:', error)
      })
  }, [isCompleted, currentRound, localPlayer, wpm, accuracy])

  useEffect(() => {
    if (phase !== 'results' || !currentRound || !localPlayer || resultSavedRef.current) return
    if (typedText.length === 0) return

    resultSavedRef.current = true
    const supabase = createClient()
    supabase
      .from('round_results')
      .upsert(
        {
          round_id: currentRound.id,
          player_id: localPlayer.id,
          wpm: Math.round(wpm),
          accuracy: parseFloat(accuracy.toFixed(4)),
          completed: isCompleted,
        },
        { onConflict: 'round_id,player_id' },
      )
      .then(({ error }: { error: unknown }) => {
        if (error) console.error('Failed to save timeout result:', error)
      })
  }, [phase, currentRound, localPlayer, typedText, wpm, accuracy, isCompleted])

  useEffect(() => {
    resultSavedRef.current = false
    reset()
  }, [roundId, reset])

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
    <div
      className="relative w-full"
      data-testid="typing-input"
      role="region"
      aria-label="Typing area"
    >
      <div
        className="rounded-lg border bg-card p-4 sm:p-6 font-mono text-base sm:text-lg leading-relaxed cursor-text min-h-30 select-none"
        onClick={handleOverlayClick}
        aria-hidden="true"
      >
        {!targetText && <span className="text-muted-foreground">Waiting for round...</span>}
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
        aria-label="Type the displayed text here"
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
