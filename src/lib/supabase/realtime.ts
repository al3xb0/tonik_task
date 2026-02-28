import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'

export interface TypingUpdatePayload {
  playerId: string
  playerName: string
  typedText: string
  wpm: number
  accuracy: number
  isCompleted: boolean
}

/**
 * Creates a Supabase Realtime broadcast channel for a specific game round.
 * Used for live typing progress updates between players.
 */
export function createRoundChannel(supabase: SupabaseClient, roundId: string): RealtimeChannel {
  return supabase.channel(`round:${roundId}`, {
    config: {
      broadcast: {
        self: false, // Don't receive own broadcasts
      },
    },
  })
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
 * Subscribes to typing updates from other players in the round.
 */
export function onTypingUpdate(
  channel: RealtimeChannel,
  callback: (payload: TypingUpdatePayload) => void,
) {
  return channel.on('broadcast', { event: 'typing_update' }, ({ payload }) => {
    callback(payload as TypingUpdatePayload)
  })
}
