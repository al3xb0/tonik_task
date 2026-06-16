// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createSupabaseMock, type SupabaseMockConfig } from '@/test/supabaseMock'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))

import { GET } from '../route'
import { createClient } from '@/lib/supabase/server'

let ipCounter = 0
function makeRequest(query = ''): Request {
  ipCounter += 1
  return new Request(`http://localhost/api/rounds${query}`, {
    headers: { 'x-forwarded-for': `10.0.0.${ipCounter}` },
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

describe('GET /api/rounds', () => {
  it('returns 401 when there is no authenticated user', async () => {
    mockClient({ user: null })

    const res = await GET(makeRequest('?mode=words'))

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  it('returns the existing active round without creating a new one', async () => {
    const activeRound = {
      id: 'round-active',
      sentence_id: 'sent-1',
      mode: 'words',
      started_at: '2026-01-01T00:00:00.000Z',
      ended_at: '2026-01-01T00:00:30.000Z',
    }
    mockClient({
      user: USER,
      tables: {
        game_rounds: { data: activeRound, error: null },
        sentences: { data: { text: 'the quick brown fox' }, error: null },
      },
    })

    const res = await GET(makeRequest('?mode=words'))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      id: 'round-active',
      sentenceText: 'the quick brown fox',
      mode: 'words',
      startedAt: activeRound.started_at,
      endedAt: activeRound.ended_at,
    })
  })

  it('creates a new round when none is active', async () => {
    const newRound = {
      id: 'round-new',
      mode: 'words',
      started_at: '2026-01-01T00:00:00.000Z',
      ended_at: '2026-01-01T00:00:30.000Z',
    }
    mockClient({
      user: USER,
      tables: {
        // 1st call: no active round; 2nd call: insert returns the new round
        game_rounds: [
          { data: null, error: null },
          { data: newRound, error: null },
        ],
        sentences: { data: [{ id: 'sent-1', text: 'hello world' }], error: null },
      },
    })

    const res = await GET(makeRequest('?mode=words'))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('round-new')
    expect(body.sentenceText).toBe('hello world')
    expect(body.mode).toBe('words')
  })

  it('returns 500 when no sentences are available', async () => {
    mockClient({
      user: USER,
      tables: {
        game_rounds: { data: null, error: null },
        sentences: { data: [], error: null },
      },
    })

    const res = await GET(makeRequest('?mode=words'))

    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe('No sentences available')
  })

  it('recovers from an insert race by returning the concurrently created round', async () => {
    const raceRound = {
      id: 'round-race',
      sentence_id: 'sent-9',
      mode: 'words',
      started_at: '2026-01-01T00:00:00.000Z',
      ended_at: '2026-01-01T00:00:30.000Z',
    }
    mockClient({
      user: USER,
      tables: {
        game_rounds: [
          { data: null, error: null }, // no active round
          { data: null, error: { message: 'duplicate key' } }, // insert fails
          { data: raceRound, error: null }, // race re-check finds a round
        ],
        sentences: [
          { data: [{ id: 'sent-1', text: 'hello world' }], error: null },
          { data: { text: 'race sentence' }, error: null },
        ],
      },
    })

    const res = await GET(makeRequest('?mode=words'))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('round-race')
    expect(body.sentenceText).toBe('race sentence')
  })

  it('defaults to sentences mode when mode param is missing', async () => {
    const activeRound = {
      id: 'r',
      sentence_id: 's',
      mode: 'sentences',
      started_at: '2026-01-01T00:00:00.000Z',
      ended_at: '2026-01-01T00:00:30.000Z',
    }
    mockClient({
      user: USER,
      tables: {
        game_rounds: { data: activeRound, error: null },
        sentences: { data: { text: 'x' }, error: null },
      },
    })

    const res = await GET(makeRequest())

    expect((await res.json()).mode).toBe('sentences')
  })

  it('enforces the rate limit on a per-client basis', async () => {
    mockClient({ user: USER, tables: { game_rounds: { data: null, error: null } } })

    const fixedIp = '203.0.113.7'
    const fire = () =>
      GET(
        new Request('http://localhost/api/rounds?mode=words', {
          headers: { 'x-forwarded-for': fixedIp },
        }),
      )

    // limit = 30 requests / window
    for (let i = 0; i < 30; i++) await fire()
    const res = await fire()

    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('60')
  })
})
