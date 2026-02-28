import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ---------- Supabase mock --------------------------------------------------

const upsertMock = vi.fn().mockReturnValue({
  then: (cb: (res: { error: unknown }) => void) => {
    cb({ error: null })
    return { catch: vi.fn() }
  },
})

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    channel: () => ({
      subscribe: vi.fn(),
      send: vi.fn(),
    }),
    removeChannel: vi.fn(),
    from: () => ({
      upsert: upsertMock,
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

// ---------- Store imports --------------------------------------------------

import { useGameStore } from '@/stores/gameStore'
import { usePlayerStore } from '@/stores/playerStore'
import { TypingInput } from '@/components/game/TypingInput'

// ---------- Helpers --------------------------------------------------------

function setActiveRound(text: string) {
  useGameStore.setState({
    currentRound: {
      id: 'round-1',
      sentenceText: text,
      mode: 'words',
      startedAt: new Date().toISOString(),
      endedAt: new Date(Date.now() + 60_000).toISOString(),
    },
    phase: 'active',
    timeLeft: 60,
  })
}

function setLocalPlayer() {
  usePlayerStore.setState({
    localPlayer: {
      id: 'player-1',
      name: 'TestUser',
      isAnonymous: false,
    },
  })
}

// ---------- Tests ----------------------------------------------------------

describe('Game flow integration', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    useGameStore.setState({
      currentRound: null,
      phase: 'waiting',
      selectedMode: 'sentences',
      timeLeft: 0,
      autoStart: false,
    })
    usePlayerStore.setState({
      localPlayer: null,
      competitors: [],
    })
    upsertMock.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('typing updates metrics and upserts competitor in store', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const targetText = 'hi'

    setActiveRound(targetText)
    setLocalPlayer()

    render(<TypingInput />)

    const textarea = screen.getByTestId('typing-textarea')
    expect(textarea).not.toBeDisabled()

    // Type one character
    await user.type(textarea, 'h')

    // Competitor should be upserted with the local player's progress
    const competitors = usePlayerStore.getState().competitors
    expect(competitors.length).toBe(1)
    expect(competitors[0].player.id).toBe('player-1')
    expect(competitors[0].typedText).toBe('h')
  })

  it('completing text calls upsert on round_results', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const targetText = 'ab'

    setActiveRound(targetText)
    setLocalPlayer()

    render(<TypingInput />)

    const textarea = screen.getByTestId('typing-textarea')

    // Type full text to trigger completion
    await user.type(textarea, 'ab')

    // Allow effects to run
    await act(async () => {
      vi.advanceTimersByTime(100)
    })

    // upsert should have been called on round_results with completed = true
    expect(upsertMock).toHaveBeenCalled()
    const call = upsertMock.mock.calls[0]
    expect(call[0]).toMatchObject({
      round_id: 'round-1',
      player_id: 'player-1',
      completed: true,
    })
    expect(call[1]).toMatchObject({ onConflict: 'round_id,player_id' })
  })

  it('does not save result when typing area is empty and round ends', async () => {
    setActiveRound('hello')
    setLocalPlayer()

    render(<TypingInput />)

    // Transition to results without typing anything
    act(() => {
      useGameStore.setState({ phase: 'results' })
    })

    await act(async () => {
      vi.advanceTimersByTime(100)
    })

    // Should NOT call upsert when typedText is empty
    expect(upsertMock).not.toHaveBeenCalled()
  })

  it('saves partial result when round ends with partial text', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    const targetText = 'hello world'

    setActiveRound(targetText)
    setLocalPlayer()

    render(<TypingInput />)

    const textarea = screen.getByTestId('typing-textarea')
    await user.type(textarea, 'hell')

    // Transition to results (time ran out)
    act(() => {
      useGameStore.setState({ phase: 'results' })
    })

    await act(async () => {
      vi.advanceTimersByTime(100)
    })

    expect(upsertMock).toHaveBeenCalled()
    const call = upsertMock.mock.calls[0]
    expect(call[0]).toMatchObject({
      round_id: 'round-1',
      player_id: 'player-1',
      completed: false,
    })
  })

  it('metrics accuracy and wpm are numeric', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    setActiveRound('test text')
    setLocalPlayer()

    render(<TypingInput />)

    const textarea = screen.getByTestId('typing-textarea')
    await user.type(textarea, 'test')

    const competitor = usePlayerStore.getState().competitors[0]
    expect(typeof competitor.wpm).toBe('number')
    expect(typeof competitor.accuracy).toBe('number')
    expect(competitor.accuracy).toBeGreaterThanOrEqual(0)
    expect(competitor.accuracy).toBeLessThanOrEqual(1)
  })
})
