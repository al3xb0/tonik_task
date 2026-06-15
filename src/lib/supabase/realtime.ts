import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'

export interface TypingUpdatePayload {
  playerId: string
  playerName: string
  typedText: string
  wpm: number
  accuracy: number
  isCompleted: boolean
}

type TypingUpdateListener = (payload: TypingUpdatePayload) => void

interface SharedRoundChannel {
  channel: RealtimeChannel
  refCount: number
  listeners: Set<TypingUpdateListener>
}

// One channel per topic shared across consumers. Supabase rejects two
// channels bound to the same topic on a single client, so sender and
// receiver must reuse the same instance.
const sharedChannels = new Map<string, SharedRoundChannel>()

const topicFor = (roundId: string) => `round:${roundId}`

/**
 * Acquires the shared Realtime channel for a round, creating and subscribing
 * it on first use. Every caller must pair this with releaseRoundChannel.
 */
export function acquireRoundChannel(supabase: SupabaseClient, roundId: string): RealtimeChannel {
  const topic = topicFor(roundId)
  const existing = sharedChannels.get(topic)
  if (existing) {
    existing.refCount += 1
    return existing.channel
  }

  const listeners = new Set<TypingUpdateListener>()
  const channel = supabase.channel(topic, {
    config: {
      broadcast: {
        self: false, // Don't receive own broadcasts
      },
    },
  })

  channel.on('broadcast', { event: 'typing_update' }, ({ payload }) => {
    for (const listener of listeners) {
      listener(payload as TypingUpdatePayload)
    }
  })

  channel.subscribe((status, err) => {
    if (status === 'CHANNEL_ERROR') {
      console.error('Realtime channel error:', err)
    } else if (status === 'TIMED_OUT') {
      console.warn('Realtime channel timed out, retrying...')
    }
  })

  sharedChannels.set(topic, { channel, refCount: 1, listeners })
  return channel
}

/**
 * Releases a previously acquired round channel. The underlying channel is
 * removed only once the last consumer releases it.
 */
export function releaseRoundChannel(supabase: SupabaseClient, roundId: string): void {
  const topic = topicFor(roundId)
  const entry = sharedChannels.get(topic)
  if (!entry) return

  entry.refCount -= 1
  if (entry.refCount <= 0) {
    supabase.removeChannel(entry.channel)
    sharedChannels.delete(topic)
  }
}

/**
 * Sends a typing progress update via broadcast.
 * Should be called through a throttle (~300ms) to avoid flooding.
 */
export function sendTypingUpdate(channel: RealtimeChannel, payload: TypingUpdatePayload) {
  return channel.send({
    type: 'broadcast',
    event: 'typing_update',
    payload,
  })
}

/**
 * Subscribes a callback to typing updates from other players in the round.
 * Returns an unsubscribe function. Requires an acquired channel for the round.
 */
export function onTypingUpdate(roundId: string, callback: TypingUpdateListener): () => void {
  const entry = sharedChannels.get(topicFor(roundId))
  if (!entry) return () => {}

  entry.listeners.add(callback)
  return () => {
    entry.listeners.delete(callback)
  }
}
