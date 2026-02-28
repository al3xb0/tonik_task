'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  calculateWPM,
  calculateAccuracy,
  getCharStates,
  getCorrectWordCount,
  type CharState,
} from '@/lib/game/metrics'

interface UseTypingMetricsOptions {
  targetText: string
  enabled?: boolean
}

interface UseTypingMetricsReturn {
  typedText: string
  charStates: CharState[]
  wpm: number
  accuracy: number
  correctChars: number
  totalKeystrokes: number
  isCompleted: boolean
  handleInput: (newText: string) => void
  reset: () => void
}

export function useTypingMetrics({
  targetText,
  enabled = true,
}: UseTypingMetricsOptions): UseTypingMetricsReturn {
  const [typedText, setTypedText] = useState('')
  const [wpm, setWpm] = useState(0)
  const [accuracy, setAccuracy] = useState(1)

  const startTimeRef = useRef<number | null>(null)
  const totalKeystrokesRef = useRef(0)
  const correctCharsRef = useRef(0)
  const [correctChars, setCorrectChars] = useState(0)
  const [totalKeystrokes, setTotalKeystrokes] = useState(0)
  const wpmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isCompleted = typedText.length >= targetText.length && targetText.length > 0

  const charStates = getCharStates(targetText, typedText)

  const countCorrectChars = useCallback(
    (typed: string): number => {
      let count = 0
      for (let i = 0; i < typed.length && i < targetText.length; i++) {
        if (typed[i] === targetText[i]) count++
      }
      return count
    },
    [targetText],
  )

  const updateWpm = useCallback(() => {
    if (!startTimeRef.current) return

    const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000
    const correctWords = getCorrectWordCount(targetText, typedText)
    setWpm(calculateWPM(correctWords, elapsedSeconds))
  }, [targetText, typedText])

  useEffect(() => {
    if (startTimeRef.current && !isCompleted) {
      wpmIntervalRef.current = setInterval(updateWpm, 500)
    }

    return () => {
      if (wpmIntervalRef.current) {
        clearInterval(wpmIntervalRef.current)
        wpmIntervalRef.current = null
      }
    }
  }, [updateWpm, isCompleted])

  const handleInput = useCallback(
    (newText: string) => {
      if (!enabled || isCompleted) return

      const clampedText = newText.slice(0, targetText.length)

      if (!startTimeRef.current) {
        startTimeRef.current = Date.now()
      }

      const lengthDiff = Math.abs(clampedText.length - typedText.length)
      totalKeystrokesRef.current += Math.max(1, lengthDiff)

      correctCharsRef.current = countCorrectChars(clampedText)

      setCorrectChars(correctCharsRef.current)
      setTotalKeystrokes(totalKeystrokesRef.current)
      setAccuracy(calculateAccuracy(correctCharsRef.current, totalKeystrokesRef.current))

      setTypedText(clampedText)

      if (clampedText.length >= targetText.length) {
        const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000
        const correctWords = getCorrectWordCount(targetText, clampedText)
        setWpm(calculateWPM(correctWords, elapsedSeconds))
      }
    },
    [enabled, isCompleted, targetText, typedText, countCorrectChars],
  )

  const reset = useCallback(() => {
    setTypedText('')
    setWpm(0)
    setAccuracy(1)
    startTimeRef.current = null
    totalKeystrokesRef.current = 0
    correctCharsRef.current = 0
    setCorrectChars(0)
    setTotalKeystrokes(0)
    if (wpmIntervalRef.current) {
      clearInterval(wpmIntervalRef.current)
      wpmIntervalRef.current = null
    }
  }, [])

  const [prevTargetText, setPrevTargetText] = useState(targetText)
  if (targetText !== prevTargetText) {
    setPrevTargetText(targetText)
    setTypedText('')
    setWpm(0)
    setAccuracy(1)
    setCorrectChars(0)
    setTotalKeystrokes(0)
  }

  useEffect(() => {
    startTimeRef.current = null
    totalKeystrokesRef.current = 0
    correctCharsRef.current = 0
    if (wpmIntervalRef.current) {
      clearInterval(wpmIntervalRef.current)
      wpmIntervalRef.current = null
    }
  }, [targetText])

  return {
    typedText,
    charStates,
    wpm,
    accuracy,
    correctChars,
    totalKeystrokes,
    isCompleted,
    handleInput,
    reset,
  }
}
