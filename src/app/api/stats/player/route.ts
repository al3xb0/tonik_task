import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const playerId = searchParams.get('playerId') ?? user.id

  const { data: results, error } = await supabase
    .from('round_results')
    .select('id, round_id, player_id, wpm, accuracy, completed, created_at')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch player stats', details: error.message },
      { status: 500 },
    )
  }

  const roundIds = results.map((r) => r.round_id)
  const { data: rounds } = await supabase
    .from('game_rounds')
    .select('id, mode, started_at')
    .in('id', roundIds.length > 0 ? roundIds : ['00000000-0000-0000-0000-000000000000'])

  const roundMap = new Map(rounds?.map((r) => [r.id, r]) ?? [])

  const enriched = results.map((r) => {
    const round = roundMap.get(r.round_id)
    return {
      id: r.id,
      roundId: r.round_id,
      playerId: r.player_id,
      wpm: r.wpm,
      accuracy: r.accuracy,
      completed: r.completed,
      createdAt: r.created_at,
      mode: round?.mode ?? 'unknown',
      roundDate: round?.started_at ?? r.created_at,
    }
  })

  return NextResponse.json(enriched)
}
