import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'

vi.mock('@/lib/supabase/client', () => ({ createClient: vi.fn() }))

import { useAuth } from '../useAuth'
import { createClient } from '@/lib/supabase/client'
import { usePlayerStore } from '@/stores/playerStore'

// Mutable state read lazily by the client mock so tests can tune behaviour.
let sessionUser: Partial<User> | null
let anonUser: Partial<User> | null
let playerRow: { id: string; name: string; is_anonymous: boolean } | null
let updateError: unknown
let authStateCb: ((event: AuthChangeEvent, session: Session | null) => void) | null

const unsubscribe = vi.fn()
const signInAnonymously = vi.fn(async () => ({ data: { user: anonUser }, error: null }))
const signOutFn = vi.fn(async () => ({ error: null }))

function buildPlayersBuilder() {
  const builder: Record<string, unknown> = {}
  for (const m of ['select', 'update', 'eq']) builder[m] = vi.fn(() => builder)
  builder.single = vi.fn(async () => ({ data: playerRow, error: null }))
  builder.then = (onF: (v: { error: unknown }) => unknown, onR?: (e: unknown) => unknown) =>
    Promise.resolve({ error: updateError }).then(onF, onR)
  return builder
}

function buildClientMock() {
  return {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: sessionUser ? { user: sessionUser } : null } })),
      signInAnonymously,
      signOut: signOutFn,
      onAuthStateChange: vi.fn((cb: typeof authStateCb) => {
        authStateCb = cb
        return { data: { subscription: { unsubscribe } } }
      }),
    },
    from: vi.fn(() => buildPlayersBuilder()),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  usePlayerStore.setState({ localPlayer: null })
  sessionUser = { id: 'user-1', is_anonymous: false }
  anonUser = { id: 'anon-1', is_anonymous: true }
  playerRow = { id: 'user-1', name: 'Alice', is_anonymous: false }
  updateError = null
  authStateCb = null
  vi.mocked(createClient).mockReturnValue(
    buildClientMock() as unknown as ReturnType<typeof createClient>,
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useAuth', () => {
  it('loads the player from an existing session', async () => {
    const { result } = renderHook(() => useAuth())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.user?.id).toBe('user-1')
    expect(result.current.player).toEqual({ id: 'user-1', name: 'Alice', isAnonymous: false })
    expect(result.current.isAnonymous).toBe(false)
    expect(usePlayerStore.getState().localPlayer?.name).toBe('Alice')
    expect(signInAnonymously).not.toHaveBeenCalled()
  })

  it('signs in anonymously when there is no session', async () => {
    sessionUser = null
    playerRow = { id: 'anon-1', name: 'Anonymous', is_anonymous: true }

    const { result } = renderHook(() => useAuth())

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(signInAnonymously).toHaveBeenCalled()
    expect(result.current.user?.id).toBe('anon-1')
    expect(result.current.isAnonymous).toBe(true)
  })

  it('updatePlayerName updates the DB, local state and store', async () => {
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let returnedError: unknown
    await act(async () => {
      returnedError = await result.current.updatePlayerName('Bob')
    })

    expect(returnedError).toBeNull()
    expect(result.current.player?.name).toBe('Bob')
    expect(usePlayerStore.getState().localPlayer?.name).toBe('Bob')
  })

  it('updatePlayerName returns the error and leaves state unchanged on failure', async () => {
    updateError = { message: 'denied' }
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let returnedError: unknown
    await act(async () => {
      returnedError = await result.current.updatePlayerName('Bob')
    })

    expect(returnedError).toEqual({ message: 'denied' })
    expect(result.current.player?.name).toBe('Alice')
  })

  it('signOut clears the session and signs back in anonymously', async () => {
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.signOut()
    })

    expect(signOutFn).toHaveBeenCalledWith({ scope: 'local' })
    expect(signInAnonymously).toHaveBeenCalled()
  })

  it('clears state on a SIGNED_OUT auth event', async () => {
    const { result } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.player).not.toBeNull()

    act(() => {
      authStateCb?.('SIGNED_OUT', null)
    })

    await waitFor(() => expect(result.current.player).toBeNull())
    expect(result.current.user).toBeNull()
    expect(usePlayerStore.getState().localPlayer).toBeNull()
  })

  it('unsubscribes from auth changes on unmount', async () => {
    const { result, unmount } = renderHook(() => useAuth())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    unmount()

    expect(unsubscribe).toHaveBeenCalled()
  })
})
