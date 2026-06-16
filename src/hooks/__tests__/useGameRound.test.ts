import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { GameRound } from '@/types/game'

vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }))
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { useGameRound } from '../useGameRound'
import { createClient } from '@/lib/supabase/client'
import { useGameStore } from '@/stores/gameStore'
import { toast } from 'sonner'

const INITIAL_STATE = {
  currentRound: null,
  phase: 'waiting' as const,
  selectedMode: 'sentences' as const,
  timeLeft: 0,
  autoStart: false,
}

let realtimeCallback: (() => void) | null = null
const removeChannel = vi.fn()

function buildClientMock() {
  realtimeCallback = null
  const subscription = {}
  const onChain = { subscribe: vi.fn(() => subscription) }
  const channel = {
    on: vi.fn((_event: string, _opts: unknown, cb: () => void) => {
      realtimeCallback = cb
      return onChain
    }),
  }
  return {
    channel: vi.fn(() => channel),
    removeChannel,
  }
}

function makeRound(secondsFromNow: number): GameRound {
  return {
    id: 'round-1',
    sentenceText: 'hello world',
    mode: 'words',
    startedAt: new Date().toISOString(),
    endedAt: new Date(Date.now() + secondsFromNow * 1000).toISOString(),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  useGameStore.setState(INITIAL_STATE)
  vi.mocked(createClient).mockReturnValue(
    buildClientMock() as unknown as ReturnType<typeof createClient>,
  )
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('useGameRound', () => {
  it('starts a round and transitions to the active phase on success', async () => {
    const round = makeRound(60)
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => round })),
    )

    const { result } = renderHook(() => useGameRound())

    await act(async () => {
      result.current.startRound()
    })

    await waitFor(() => expect(useGameStore.getState().phase).toBe('active'))
    expect(useGameStore.getState().currentRound).toEqual(round)
    expect(useGameStore.getState().autoStart).toBe(true)
    expect(useGameStore.getState().timeLeft).toBeGreaterThan(0)
    expect(toast.success).toHaveBeenCalledWith('Round started!', expect.anything())
  })

  it('shows an error toast and stays idle when the response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 500, json: async () => ({ error: 'boom' }) })),
    )

    const { result } = renderHook(() => useGameRound())

    await act(async () => {
      result.current.startRound()
    })

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('boom'))
    expect(useGameStore.getState().phase).toBe('waiting')
    expect(useGameStore.getState().currentRound).toBeNull()
  })

  it('shows a network error toast when fetch rejects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline')
      }),
    )

    const { result } = renderHook(() => useGameRound())

    await act(async () => {
      result.current.startRound()
    })

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Network error — could not load round'),
    )
  })

  it('exitRound clears timers and resets the store', async () => {
    useGameStore.setState({
      currentRound: makeRound(60),
      phase: 'active',
      autoStart: true,
      timeLeft: 30,
    })

    const { result } = renderHook(() => useGameRound())

    act(() => {
      result.current.exitRound()
    })

    const state = useGameStore.getState()
    expect(state.phase).toBe('waiting')
    expect(state.currentRound).toBeNull()
    expect(state.autoStart).toBe(false)
  })

  it('subscribes to realtime inserts and refetches when autoStart is on', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => makeRound(60) }))
    vi.stubGlobal('fetch', fetchMock)
    useGameStore.setState({ autoStart: true })

    const { unmount } = renderHook(() => useGameRound())

    expect(createClient).toHaveBeenCalled()
    expect(realtimeCallback).toBeTypeOf('function')

    await act(async () => {
      realtimeCallback?.()
    })
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    unmount()
    expect(removeChannel).toHaveBeenCalled()
  })

  it('does not subscribe when disabled', () => {
    renderHook(() => useGameRound({ enabled: false }))
    expect(createClient).not.toHaveBeenCalled()
  })

  it('moves to the results phase when the round timer runs out', async () => {
    vi.useFakeTimers()
    try {
      useGameStore.setState({
        currentRound: makeRound(1),
        phase: 'active',
      })

      renderHook(() => useGameRound())

      await act(async () => {
        vi.advanceTimersByTime(1500)
      })

      expect(useGameStore.getState().phase).toBe('results')
    } finally {
      vi.useRealTimers()
    }
  })
})
