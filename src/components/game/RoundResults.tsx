'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { useGameStore } from '@/stores/gameStore'
import { usePlayerStore } from '@/stores/playerStore'

interface RoundResultEntry {
  id: string
  roundId: string
  playerId: string
  playerName: string
  wpm: number
  accuracy: number
  completed: boolean
}

const podiumColors = [
  'from-yellow-400/20 to-yellow-500/5 border-yellow-500/30',
  'from-gray-300/20 to-gray-400/5 border-gray-400/30',
  'from-amber-600/20 to-amber-700/5 border-amber-700/30',
]

const podiumEmojis = ['🥇', '🥈', '🥉']

export function RoundResults() {
  const currentRound = useGameStore((s) => s.currentRound)
  const phase = useGameStore((s) => s.phase)
  const { competitors, localPlayer } = usePlayerStore()
  const [dbResults, setDbResults] = useState<RoundResultEntry[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (phase !== 'results' || !currentRound) {
      setDbResults([])
      setLoaded(false)
      return
    }

    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/stats/results?roundId=${currentRound.id}`)
        if (res.ok) {
          const data = await res.json()
          setDbResults(data)
        }
      } catch {
        // fall back to in-memory competitors
      } finally {
        setLoaded(true)
      }
    }

    fetchResults()
  }, [phase, currentRound?.id])

  if (phase !== 'results') return null

  const results: {
    playerId: string
    playerName: string
    wpm: number
    accuracy: number
    completed: boolean
  }[] = []

  if (dbResults.length > 0) {
    for (const r of dbResults) {
      results.push({
        playerId: r.playerId,
        playerName: r.playerName,
        wpm: r.wpm,
        accuracy: r.accuracy,
        completed: r.completed,
      })
    }
  }

  for (const c of competitors) {
    if (!results.find((r) => r.playerId === c.player.id)) {
      results.push({
        playerId: c.player.id,
        playerName: c.player.name,
        wpm: c.wpm,
        accuracy: c.accuracy,
        completed: c.isCompleted,
      })
    }
  }

  results.sort((a, b) => b.wpm - a.wpm)

  const topThree = results.slice(0, 3)
  const rest = results.slice(3)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="w-full space-y-4"
    >
      <motion.h2
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="text-center text-xl font-bold"
      >
        Round Results
      </motion.h2>

      {results.length === 0 && loaded && (
        <p className="text-center text-muted-foreground text-sm">
          No results for this round yet.
        </p>
      )}

      <div className="flex items-end justify-center gap-3 py-4">
        <AnimatePresence>
          {topThree.map((entry, idx) => {
            const isMe = entry.playerId === localPlayer?.id
            const podiumHeight = idx === 0 ? 'h-32' : idx === 1 ? 'h-24' : 'h-20'
            const displayOrder = idx === 0 ? 1 : idx === 1 ? 0 : 2

            return (
              <motion.div
                key={entry.playerId}
                initial={{ opacity: 0, y: 50, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: 0.2 + displayOrder * 0.15,
                  duration: 0.5,
                  type: 'spring',
                  stiffness: 200,
                  damping: 20,
                }}
                className="flex flex-col items-center"
                style={{ order: displayOrder }}
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 0.5 + displayOrder * 0.15,
                    type: 'spring',
                    stiffness: 300,
                  }}
                  className="text-2xl mb-1"
                >
                  {podiumEmojis[idx]}
                </motion.span>

                <div className="text-center mb-2">
                  <p className={`text-sm font-medium truncate max-w-25 ${isMe ? 'text-primary font-bold' : ''}`}>
                    {entry.playerName}
                  </p>
                  {isMe && (
                    <Badge variant="secondary" className="text-[10px] mt-0.5">
                      You
                    </Badge>
                  )}
                </div>

                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  transition={{ delay: 0.3 + displayOrder * 0.15, duration: 0.4 }}
                  className={`${podiumHeight} w-24 rounded-t-lg bg-linear-to-b ${podiumColors[idx]} border border-b-0 flex flex-col items-center justify-center gap-1`}
                >
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 + displayOrder * 0.15 }}
                    className="text-lg font-bold tabular-nums"
                  >
                    {entry.wpm}
                  </motion.span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    WPM
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {(entry.accuracy * 100).toFixed(1)}%
                  </span>
                </motion.div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {rest.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="space-y-1"
        >
          {rest.map((entry, idx) => {
            const isMe = entry.playerId === localPlayer?.id
            return (
              <motion.div
                key={entry.playerId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 + idx * 0.05 }}
                className={`flex items-center justify-between px-4 py-2 rounded-lg text-sm ${
                  isMe ? 'bg-primary/5 border border-primary/20' : 'bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground w-6 text-right font-mono">
                    #{idx + 4}
                  </span>
                  <span className={isMe ? 'font-semibold' : ''}>
                    {entry.playerName}
                  </span>
                  {isMe && (
                    <Badge variant="secondary" className="text-[10px]">You</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 font-mono tabular-nums text-muted-foreground">
                  <span>{entry.wpm} WPM</span>
                  <span>{(entry.accuracy * 100).toFixed(1)}%</span>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}
