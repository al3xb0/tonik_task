import { vi } from 'vitest'

export interface SbResult {
  data: unknown
  error: unknown
}

type Source = SbResult | SbResult[]

export interface SupabaseMockConfig {
  /** User returned by auth.getUser(). null → unauthorized. */
  user?: { id: string } | null
  getUserError?: unknown
  /** Per-table results. Array = FIFO queue (one consumed per terminal call); object = repeated. */
  tables?: Record<string, Source>
  /** Per-rpc-name results. Same queue/repeat semantics as tables. */
  rpc?: Record<string, Source>
}

const DEFAULT: SbResult = { data: null, error: null }

function cloneSources(input: Record<string, Source> | undefined): Record<string, Source> {
  const out: Record<string, Source> = {}
  for (const [k, v] of Object.entries(input ?? {})) {
    out[k] = Array.isArray(v) ? [...v] : v
  }
  return out
}

function takeNext(map: Record<string, Source>, key: string): SbResult {
  const v = map[key]
  if (v === undefined) return DEFAULT
  if (Array.isArray(v)) return v.shift() ?? DEFAULT
  return v
}

const CHAIN_METHODS = [
  'select',
  'insert',
  'update',
  'delete',
  'upsert',
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'order',
  'limit',
  'range',
  'in',
  'match',
] as const

/**
 * Builds a chainable Supabase client mock sufficient for the stats/rounds API routes.
 * Awaiting a query builder, or calling .single()/.maybeSingle(), resolves to the next
 * configured result for that table.
 */
export function createSupabaseMock(config: SupabaseMockConfig = {}) {
  const tables = cloneSources(config.tables)
  const rpc = cloneSources(config.rpc)

  function makeBuilder(table: string) {
    const builder: Record<string, unknown> = {}
    for (const m of CHAIN_METHODS) builder[m] = vi.fn(() => builder)

    const resolve = () => Promise.resolve(takeNext(tables, table))
    builder.single = vi.fn(resolve)
    builder.maybeSingle = vi.fn(resolve)
    builder.then = (onF: (v: SbResult) => unknown, onR?: (e: unknown) => unknown) =>
      resolve().then(onF, onR)
    builder.catch = (onR: (e: unknown) => unknown) => resolve().catch(onR)
    return builder
  }

  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: config.user ?? null },
        error: config.getUserError ?? null,
      })),
    },
    from: vi.fn((table: string) => makeBuilder(table)),
    rpc: vi.fn(async (name: string) => takeNext(rpc, name)),
  }
}

export type SupabaseMock = ReturnType<typeof createSupabaseMock>
