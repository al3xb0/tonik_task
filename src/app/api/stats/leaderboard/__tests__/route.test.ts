// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createSupabaseMock, type SupabaseMockConfig } from '@/test/supabaseMock'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { GET } from '../route'
import { createClient } from '@/lib/supabase/server'

let ipCounter = 0
function makeRequest(query = ''): Request {
  ipCounter += 1
  return new Request(`http://localhost/api/stats/leaderboard${query}`, {
    headers: { 'x-forwarded-for': `10.1.0.${ipCounter}` },
  })
}

function mockClient(config: SupabaseMockConfig) {
  vi.mocked(createClient).mockResolvedValue(
    createSupabaseMock(config) as unknown as Awaited<ReturnType<typeof createClient>>,
  )
}

const USER = { id: 'user-1' }
const RPC_ERROR = { data: null, error: { message: 'rpc missing' } }

const RESULTS = [
  { player_id: 'p1', wpm: 100, accuracy: 0.9, completed: true },
  { player_id: 'p1', wpm: 80, accuracy: 0.95, completed: false },
  { player_id: 'p2', wpm: 60, accuracy: 1.0, completed: true },
]
const PLAYERS = [
  { id: 'p1', name: 'Alice', is_anonymous: false },
  { id: 'p2', name: 'Bob', is_anonymous: true },
]

function fallbackConfig(overrides: Partial<SupabaseMockConfig> = {}): SupabaseMockConfig {
  return {
    user: USER,
    rpc: { get_leaderboard: RPC_ERROR },
    tables: {
      round_results: { data: RESULTS, error: null },
      players: { data: PLAYERS, error: null },
    },
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/stats/leaderboard', () => {
  it('returns 401 when unauthenticated', async () => {
    mockClient({ user: null })

    const res = await GET(makeRequest())

    expect(res.status).toBe(401)
  })

  it('returns the RPC result directly when the aggregation RPC succeeds', async () => {
    const aggregated = [{ playerId: 'p1', playerName: 'Alice', bestWpm: 120 }]
    mockClient({
      user: USER,
      rpc: {
        get_leaderboard: { data: aggregated, error: null },
        get_leaderboard_count: { data: 42, error: null },
      },
    })

    const res = await GET(makeRequest())

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ items: aggregated, total: 42 })
  })

  describe('fallback aggregation', () => {
    it('aggregates per-player metrics correctly', async () => {
      mockClient(fallbackConfig())

      const res = await GET(makeRequest())
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.total).toBe(2)

      const alice = body.items.find((i: { playerId: string }) => i.playerId === 'p1')
      expect(alice).toMatchObject({
        playerName: 'Alice',
        bestWpm: 100,
        avgWpm: 90, // round((100 + 80) / 2)
        avgAccuracy: 0.925, // (0.9 + 0.95) / 2
        gamesPlayed: 2,
        gamesCompleted: 1,
      })

      const bob = body.items.find((i: { playerId: string }) => i.playerId === 'p2')
      expect(bob).toMatchObject({
        playerName: 'Bob',
        bestWpm: 60,
        avgWpm: 60,
        avgAccuracy: 1,
        gamesPlayed: 1,
        gamesCompleted: 1,
      })
    })

    it('sorts by bestWpm descending by default', async () => {
      mockClient(fallbackConfig())

      const body = await (await GET(makeRequest())).json()

      expect(body.items.map((i: { playerId: string }) => i.playerId)).toEqual(['p1', 'p2'])
    })

    it('supports ascending sort by name', async () => {
      mockClient(fallbackConfig())

      const body = await (await GET(makeRequest('?sort=name&order=asc'))).json()

      expect(body.items.map((i: { playerName: string }) => i.playerName)).toEqual(['Alice', 'Bob'])
    })

    it('falls back to "Unknown" when a player row is missing', async () => {
      mockClient(
        fallbackConfig({
          tables: {
            round_results: { data: [RESULTS[2]], error: null },
            players: { data: [], error: null },
          },
        }),
      )

      const body = await (await GET(makeRequest())).json()

      expect(body.items[0].playerName).toBe('Unknown')
    })

    it('applies limit and offset pagination', async () => {
      mockClient(fallbackConfig())

      const body = await (await GET(makeRequest('?limit=1&offset=1'))).json()

      // total counts all players; items are paginated to the second entry
      expect(body.total).toBe(2)
      expect(body.items).toHaveLength(1)
      expect(body.items[0].playerId).toBe('p2')
    })

    it('returns 500 when the fallback query also fails', async () => {
      mockClient({
        user: USER,
        rpc: { get_leaderboard: RPC_ERROR },
        tables: { round_results: { data: null, error: { message: 'table gone' } } },
      })

      const res = await GET(makeRequest())

      expect(res.status).toBe(500)
      expect((await res.json()).error).toBe('Failed to fetch leaderboard')
    })
  })
})
