import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { GameMode } from '@/types/game'

const DURATION_BY_MODE: Record<GameMode, number> = {
  words: 30,
  sentences: 60,
  text: 90,
  mixed: 60,
}

function getRandomBaseMode(): GameMode {
  const modes: GameMode[] = ['words', 'sentences', 'text']
  return modes[Math.floor(Math.random() * modes.length)]
}

export async function GET(request: Request) {
  const supabase = await createClient()

  const { searchParams } = new URL(request.url)
  const mode = (searchParams.get('mode') as GameMode) || 'sentences'

  const { data: activeRound } = await supabase
    .from('game_rounds')
    .select('id, sentence_text, mode, started_at, ended_at')
    .gt('ended_at', new Date().toISOString())
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (activeRound) {
    return NextResponse.json({
      id: activeRound.id,
      sentenceText: activeRound.sentence_text,
      mode: activeRound.mode,
      startedAt: activeRound.started_at,
      endedAt: activeRound.ended_at,
    })
  }

  const queryMode = mode === 'mixed' ? getRandomBaseMode() : mode
  const duration = DURATION_BY_MODE[mode]

  const { data: sentence, error: sentenceError } = await supabase
    .from('sentences')
    .select('text')
    .eq('mode', queryMode)
    .limit(1)
    .order('id', { ascending: false })
    .single()

  if (sentenceError || !sentence) {
    return NextResponse.json(
      { error: 'No sentences available' },
      { status: 500 },
    )
  }

  const startedAt = new Date()
  const endedAt = new Date(startedAt.getTime() + duration * 1000)

  const { data: newRound, error: roundError } = await supabase
    .from('game_rounds')
    .insert({
      sentence_text: sentence.text,
      mode,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
    })
    .select('id, sentence_text, mode, started_at, ended_at')
    .single()

  if (roundError || !newRound) {
    return NextResponse.json(
      { error: 'Failed to create round' },
      { status: 500 },
    )
  }

  return NextResponse.json({
    id: newRound.id,
    sentenceText: newRound.sentence_text,
    mode: newRound.mode,
    startedAt: newRound.started_at,
    endedAt: newRound.ended_at,
  })
}
