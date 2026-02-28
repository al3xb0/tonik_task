/**
 * Simple in-memory sliding-window rate limiter for API routes.
 * NOT suitable for multi-instance deployments — use Redis for that.
 */
interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup stale entries every 60 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (now > entry.resetAt) {
        store.delete(key)
      }
    }
  }, 60_000)
}

export interface RateLimitConfig {
  /** Maximum requests per window */
  limit: number
  /** Window duration in milliseconds */
  windowMs: number
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = store.get(identifier)

  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowMs
    store.set(identifier, { count: 1, resetAt })
    return { allowed: true, remaining: config.limit - 1, resetAt }
  }

  entry.count += 1
  const allowed = entry.count <= config.limit
  return {
    allowed,
    remaining: Math.max(0, config.limit - entry.count),
    resetAt: entry.resetAt,
  }
}

/**
 * Extract a client identifier from a request.
 * Uses X-Forwarded-For or falls back to a generic key.
 */
export function getClientId(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}
