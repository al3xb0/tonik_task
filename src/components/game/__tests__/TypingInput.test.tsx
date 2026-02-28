import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel: () => ({
      subscribe: vi.fn(),
      send: vi.fn(),
    }),
    removeChannel: vi.fn(),
    from: () => ({
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
}))

vi.mock('@/lib/supabase/realtime', () => ({
  createRoundChannel: () => ({
    subscribe: vi.fn(),
    send: vi.fn(),
  }),
  sendTypingUpdate: vi.fn(),
}))

import { useGameStore } from '@/stores/gameStore'

import { TypingInput } from '@/components/game/TypingInput'

describe('TypingInput', () => {
  beforeEach(() => {
    useGameStore.setState({
      currentRound: null,
      phase: 'waiting',
      selectedMode: 'sentences',
      timeLeft: 0,
    })
  })

  it('renders without errors', () => {
    render(<TypingInput />)
    expect(screen.getByTestId('typing-input')).toBeInTheDocument()
  })

  it('shows waiting message when no round', () => {
    render(<TypingInput />)
    expect(screen.getByText('Waiting for round...')).toBeInTheDocument()
  })

  it('textarea is disabled in waiting phase', () => {
    render(<TypingInput />)
    const textarea = screen.getByTestId('typing-textarea')
    expect(textarea).toBeDisabled()
  })

  it('textarea is disabled in results phase', () => {
    useGameStore.setState({
      currentRound: {
        id: 'r1',
        sentenceText: 'hello world',
        mode: 'sentences',
        startedAt: new Date().toISOString(),
        endedAt: new Date(Date.now() + 60000).toISOString(),
      },
      phase: 'results',
    })

    render(<TypingInput />)
    const textarea = screen.getByTestId('typing-textarea')
    expect(textarea).toBeDisabled()
  })

  it('displays target text characters when round is active', () => {
    useGameStore.setState({
      currentRound: {
        id: 'r1',
        sentenceText: 'hi',
        mode: 'words',
        startedAt: new Date().toISOString(),
        endedAt: new Date(Date.now() + 30000).toISOString(),
      },
      phase: 'active',
    })

    render(<TypingInput />)
    expect(screen.queryByText('Waiting for round...')).not.toBeInTheDocument()
    expect(screen.getByTestId('typing-textarea')).not.toBeDisabled()
  })
})
