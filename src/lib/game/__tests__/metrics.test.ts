import { describe, it, expect } from 'vitest'
import { calculateWPM, calculateAccuracy, getCharStates, getCorrectWordCount } from '../metrics'

describe('calculateWPM', () => {
  it('returns 0 when elapsed seconds is 0', () => {
    expect(calculateWPM(10, 0)).toBe(0)
  })

  it('returns 0 when elapsed seconds is negative', () => {
    expect(calculateWPM(5, -10)).toBe(0)
  })

  it('calculates WPM correctly for 5 words in 30 seconds', () => {
    // 5 words / 0.5 minutes = 10 WPM
    expect(calculateWPM(5, 30)).toBe(10)
  })

  it('calculates WPM correctly for 10 words in 60 seconds', () => {
    // 10 words / 1 minute = 10 WPM
    expect(calculateWPM(10, 60)).toBe(10)
  })

  it('rounds WPM to nearest integer', () => {
    // 7 words / (45/60) minutes = 7 / 0.75 = 9.333...
    expect(calculateWPM(7, 45)).toBe(9)
  })

  it('returns 0 when no correct words', () => {
    expect(calculateWPM(0, 60)).toBe(0)
  })
})

describe('calculateAccuracy', () => {
  it('returns 1 (100%) when no keystrokes', () => {
    expect(calculateAccuracy(0, 0)).toBe(1)
  })

  it('returns 1 when all keystrokes are correct', () => {
    expect(calculateAccuracy(10, 10)).toBe(1)
  })

  it('calculates accuracy correctly with errors', () => {
    // 8 correct out of 10 keystrokes = 0.8
    expect(calculateAccuracy(8, 10)).toBe(0.8)
  })

  it('includes backspace in total keystrokes', () => {
    // 5 correct chars, but 7 total keystrokes (2 were backspaces)
    // accuracy = 5/7 ≈ 0.714
    expect(calculateAccuracy(5, 7)).toBeCloseTo(0.714, 2)
  })

  it('clamps accuracy to maximum 1', () => {
    // Edge case: more correct than total (shouldn't happen, but be safe)
    expect(calculateAccuracy(15, 10)).toBe(1)
  })

  it('returns 0 when no correct chars but some keystrokes', () => {
    expect(calculateAccuracy(0, 10)).toBe(0)
  })
})

describe('getCharStates', () => {
  it('returns all pending when nothing is typed', () => {
    const states = getCharStates('hello', '')
    expect(states).toEqual(['current', 'pending', 'pending', 'pending', 'pending'])
  })

  it('marks correct characters as correct', () => {
    const states = getCharStates('hello', 'hel')
    expect(states).toEqual(['correct', 'correct', 'correct', 'current', 'pending'])
  })

  it('marks incorrect characters as incorrect', () => {
    const states = getCharStates('hello', 'hxl')
    expect(states).toEqual(['correct', 'incorrect', 'correct', 'current', 'pending'])
  })

  it('handles fully typed correct text', () => {
    const states = getCharStates('hi', 'hi')
    expect(states).toEqual(['correct', 'correct'])
  })

  it('handles fully typed text with errors', () => {
    const states = getCharStates('hi', 'hx')
    expect(states).toEqual(['correct', 'incorrect'])
  })

  it('handles empty target and empty typed', () => {
    const states = getCharStates('', '')
    expect(states).toEqual([])
  })

  it('handles single character target', () => {
    const states = getCharStates('a', '')
    expect(states).toEqual(['current'])
  })

  it('correctly handles spaces in text', () => {
    const states = getCharStates('a b', 'a ')
    expect(states).toEqual(['correct', 'correct', 'current'])
  })
})

describe('getCorrectWordCount', () => {
  it('counts fully correct words', () => {
    expect(getCorrectWordCount('hello world', 'hello world')).toBe(2)
  })

  it('does not count word with an error', () => {
    expect(getCorrectWordCount('hello world', 'hellx world')).toBe(1)
  })

  it('does not count the word currently being typed', () => {
    // "hel" is a partial word, should not be counted
    expect(getCorrectWordCount('hello world', 'hel')).toBe(0)
  })

  it('counts first word when second is being typed', () => {
    // "hello w" — first word is complete and correct, second is partial
    expect(getCorrectWordCount('hello world', 'hello w')).toBe(1)
  })

  it('returns 0 when nothing is typed', () => {
    expect(getCorrectWordCount('hello world', '')).toBe(0)
  })

  it('returns 0 when all words have errors', () => {
    expect(getCorrectWordCount('hello world', 'hellx worlx')).toBe(0)
  })

  it('handles single word target fully typed correctly', () => {
    expect(getCorrectWordCount('hello', 'hello')).toBe(1)
  })

  it('handles single word target with error', () => {
    expect(getCorrectWordCount('hello', 'hellx')).toBe(0)
  })
})
