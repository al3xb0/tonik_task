// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createSupabaseMock, type SupabaseMockConfig } from '@/test/supabaseMock'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { GET } from '../route'
import { createClient } from '@/lib/supabase/server'

let ipCounter = 0
function makeRequest(query = ''): Request {
  ipCounter += 1
  return new Request(`http://localhost/api/stats/player${query}`, {
    headers: { 'x-forwarded-for': `10.3.0.${ipCounter}` },
  })
}

function mockClient(config: SupabaseMockConfig) {
  vi.mocked(createClient).mockResolvedValue(
    createSupabaseMock(config) as unknown as Awaited<ReturnType<typeof createClient>>,
  )
}

const USER = { id: 'user-1' }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/stats/player', () => {
  it('returns 401 when unauthenticated', async () => {
    mockClient({ user: null })
    expect((await GET(makeRequest())).status).toBe(401)
  })

  it('enriches a player result with its round mode and date', async () => {
    mockClient({
      user: USER,
      tables: {
        round_results: {
          data: [
            {
              id: 'res-1',
              round_id: 'r1',
              player_id: 'user-1',
              wpm: 88,
              accuracy: 0.99,
              completed: true,
              created_at: '2026-01-02T00:00:00.000Z',
            },
          ],
          error: null,
        },
        game_rounds: {
          data: [{ id: 'r1', mode: 'words', started_at: '2026-01-01T12:00:00.000Z' }],
          error: null,
        },
      },
    })

    const body = await (await GET(makeRequest())).json()

    expect(body).toEqual([
      {
        id: 'res-1',
        roundId: 'r1',
        playerId: 'user-1',
        wpm: 88,
        accuracy: 0.99,
        completed: true,
        createdAt: '2026-01-02T00:00:00.000Z',
        mode: 'words',
        roundDate: '2026-01-01T12:00:00.000Z',
      },
    ])
  })

  it('falls back to "unknown" mode and the result date when the round is missing', async () => {
    mockClient({
      user: USER,
      tables: {
        round_results: {
          data: [
            {
              id: 'res-1',
              round_id: 'gone',
              player_id: 'user-1',
              wpm: 70,
              accuracy: 0.9,
              completed: false,
              created_at: '2026-01-02T00:00:00.000Z',
            },
          ],
          error: null,
        },
        game_rounds: { data: [], error: null },
      },
    })

    const body = await (await GET(makeRequest())).json()

    expect(body[0].mode).toBe('unknown')
    expect(body[0].roundDate).toBe('2026-01-02T00:00:00.000Z')
  })

  it('returns 500 when the query fails', async () => {
    mockClient({
      user: USER,
      tables: { round_results: { data: null, error: { message: 'boom' } } },
    })

    const res = await GET(makeRequest())

    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe('Failed to fetch player stats')
  })
})
