export type CharState = 'correct' | 'incorrect' | 'pending' | 'current'

/**
 * Calculate Words Per Minute.
 * Only counts correctly typed words.
 * A word is ~5 characters in standard WPM calculation,
 * but here we count actual correct words.
 */
export function calculateWPM(correctWords: number, elapsedSeconds: number): number {
  if (elapsedSeconds <= 0) return 0
  const minutes = elapsedSeconds / 60
  return Math.round(correctWords / minutes)
}

/**
 * Calculate typing accuracy.
 * Ratio of correct characters to total keystrokes.
 * Backspace counts as a keystroke (increases denominator).
 */
export function calculateAccuracy(correctChars: number, totalKeystrokes: number): number {
  if (totalKeystrokes <= 0) return 1
  return Math.min(1, Math.max(0, correctChars / totalKeystrokes))
}

/**
 * Returns an array of CharState for each character in the target string.
 * - 'correct'   — typed character matches target
 * - 'incorrect' — typed character doesn't match target
 * - 'current'   — the next character to type (cursor position)
 * - 'pending'   — not yet reached
 */
export function getCharStates(target: string, typed: string): CharState[] {
  const states: CharState[] = []

  for (let i = 0; i < target.length; i++) {
    if (i < typed.length) {
      states.push(typed[i] === target[i] ? 'correct' : 'incorrect')
    } else if (i === typed.length) {
      states.push('current')
    } else {
      states.push('pending')
    }
  }

  return states
}

/**
 * Count correct words in typed text compared to target.
 * A word is correct only if ALL its characters match the target exactly.
 * Words are split by spaces following the target's word boundaries.
 */
export function getCorrectWordCount(target: string, typed: string): number {
  const targetWords = target.split(' ')
  const typedWords = typed.split(' ')

  let correctCount = 0

  for (let i = 0; i < targetWords.length; i++) {
    if (i >= typedWords.length) break

    // Only count fully typed words (not the last partial word unless it's complete)
    const isLastTypedWord = i === typedWords.length - 1
    const isTypingComplete = typed.length >= target.length

    if (isLastTypedWord && !isTypingComplete) {
      // Skip the word currently being typed
      continue
    }

    if (typedWords[i] === targetWords[i]) {
      correctCount++
    }
  }

  return correctCount
}
