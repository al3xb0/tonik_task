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
  const roundId = searchParams.get('roundId')

  if (!roundId) {
    return NextResponse.json({ error: 'roundId is required' }, { status: 400 })
  }

  const { data: results, error } = await supabase
    .from('round_results')
    .select('id, round_id, player_id, wpm, accuracy, completed, created_at')
    .eq('round_id', roundId)
    .order('wpm', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch results', details: error.message },
      { status: 500 },
    )
  }

  const playerIds = results.map((r) => r.player_id)
  const { data: players } = await supabase
    .from('players')
    .select('id, name, is_anonymous')
    .in('id', playerIds.length > 0 ? playerIds : ['00000000-0000-0000-0000-000000000000'])

  const playerMap = new Map(players?.map((p) => [p.id, p]) ?? [])

  const enriched = results.map((r) => ({
    id: r.id,
    roundId: r.round_id,
    playerId: r.player_id,
    playerName: playerMap.get(r.player_id)?.name ?? 'Unknown',
    wpm: r.wpm,
    accuracy: r.accuracy,
    completed: r.completed,
    createdAt: r.created_at,
  }))

  return NextResponse.json(enriched)
}
