'use client'

import { motion } from 'framer-motion'
import { useGameStore } from '@/stores/gameStore'

const ROUND_DURATIONS: Record<string, number> = {
  words: 30,
  sentences: 60,
  text: 90,
  mixed: 60,
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function RoundTimer() {
  const { timeLeft, phase, currentRound } = useGameStore()

  if (phase === 'results') {
    return (
      <div className="flex flex-col items-center gap-2">
        <span className="text-lg font-semibold text-muted-foreground">
          Next round in 5...
        </span>
      </div>
    )
  }

  if (phase === 'waiting' || !currentRound) {
    return (
      <div className="flex flex-col items-center gap-2">
        <span className="text-lg font-semibold text-muted-foreground">
          Waiting for round...
        </span>
      </div>
    )
  }

  const totalDuration = ROUND_DURATIONS[currentRound.mode] ?? 60
  const progress = timeLeft / totalDuration
  const isUrgent = timeLeft < 10

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-md">
      <span
        className={`text-3xl font-bold tabular-nums ${
          isUrgent ? 'text-red-500' : 'text-foreground'
        }`}
      >
        {formatTime(timeLeft)}
      </span>
      <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            isUrgent ? 'bg-red-500' : 'bg-primary'
          }`}
          initial={false}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.5, ease: 'linear' }}
        />
      </div>
    </div>
  )
}
