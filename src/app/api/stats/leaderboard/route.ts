import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: results, error } = await supabase
    .from('round_results')
    .select('player_id, wpm, accuracy, completed')

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard', details: error.message },
      { status: 500 },
    )
  }

  const playerAgg = new Map<
    string,
    { totalWpm: number; totalAccuracy: number; games: number; bestWpm: number; completed: number }
  >()

  for (const r of results) {
    const existing = playerAgg.get(r.player_id)
    if (existing) {
      existing.totalWpm += r.wpm ?? 0
      existing.totalAccuracy += r.accuracy ?? 0
      existing.games += 1
      existing.bestWpm = Math.max(existing.bestWpm, r.wpm ?? 0)
      if (r.completed) existing.completed += 1
    } else {
      playerAgg.set(r.player_id, {
        totalWpm: r.wpm ?? 0,
        totalAccuracy: r.accuracy ?? 0,
        games: 1,
        bestWpm: r.wpm ?? 0,
        completed: r.completed ? 1 : 0,
      })
    }
  }

  const playerIds = Array.from(playerAgg.keys())
  const { data: players } = await supabase
    .from('players')
    .select('id, name, is_anonymous')
    .in('id', playerIds.length > 0 ? playerIds : ['00000000-0000-0000-0000-000000000000'])

  const playerMap = new Map(players?.map((p) => [p.id, p]) ?? [])

  const leaderboard = playerIds
    .map((id) => {
      const agg = playerAgg.get(id)!
      const player = playerMap.get(id)
      return {
        playerId: id,
        playerName: player?.name ?? 'Unknown',
        bestWpm: agg.bestWpm,
        avgWpm: Math.round(agg.totalWpm / agg.games),
        avgAccuracy: parseFloat((agg.totalAccuracy / agg.games).toFixed(4)),
        gamesPlayed: agg.games,
        gamesCompleted: agg.completed,
      }
    })
    .sort((a, b) => b.bestWpm - a.bestWpm)

  return NextResponse.json(leaderboard)
}
