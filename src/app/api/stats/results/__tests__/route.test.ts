// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createSupabaseMock, type SupabaseMockConfig } from '@/test/supabaseMock'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { GET } from '../route'
import { createClient } from '@/lib/supabase/server'

let ipCounter = 0
function makeRequest(query = ''): Request {
  ipCounter += 1
  return new Request(`http://localhost/api/stats/results${query}`, {
    headers: { 'x-forwarded-for': `10.2.0.${ipCounter}` },
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

describe('GET /api/stats/results', () => {
  it('returns 401 when unauthenticated', async () => {
    mockClient({ user: null })
    expect((await GET(makeRequest('?roundId=r1'))).status).toBe(401)
  })

  it('returns 400 when roundId is missing', async () => {
    mockClient({ user: USER })

    const res = await GET(makeRequest())

    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('roundId is required')
  })

  it('returns results enriched with player names', async () => {
    mockClient({
      user: USER,
      tables: {
        round_results: {
          data: [
            {
              id: 'res-1',
              round_id: 'r1',
              player_id: 'p1',
              wpm: 90,
              accuracy: 0.97,
              completed: true,
              created_at: '2026-01-01T00:00:00.000Z',
            },
          ],
          error: null,
        },
        players: { data: [{ id: 'p1', name: 'Alice', is_anonymous: false }], error: null },
      },
    })

    const res = await GET(makeRequest('?roundId=r1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual([
      {
        id: 'res-1',
        roundId: 'r1',
        playerId: 'p1',
        playerName: 'Alice',
        wpm: 90,
        accuracy: 0.97,
        completed: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ])
  })

  it('falls back to "Unknown" for results without a matching player', async () => {
    mockClient({
      user: USER,
      tables: {
        round_results: {
          data: [
            {
              id: 'res-1',
              round_id: 'r1',
              player_id: 'ghost',
              wpm: 50,
              accuracy: 0.8,
              completed: false,
              created_at: '2026-01-01T00:00:00.000Z',
            },
          ],
          error: null,
        },
        players: { data: [], error: null },
      },
    })

    const body = await (await GET(makeRequest('?roundId=r1'))).json()

    expect(body[0].playerName).toBe('Unknown')
  })

  it('returns 500 when the results query fails', async () => {
    mockClient({
      user: USER,
      tables: { round_results: { data: null, error: { message: 'db down' } } },
    })

    const res = await GET(makeRequest('?roundId=r1'))

    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe('Failed to fetch results')
  })
})
