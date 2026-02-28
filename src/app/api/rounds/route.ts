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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const mode = (searchParams.get('mode') as GameMode) || 'sentences'

  const { data: activeRound, error: activeError } = await supabase
    .from('game_rounds')
    .select('id, sentence_id, mode, started_at, ended_at')
    .gt('ended_at', new Date().toISOString())
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (activeRound) {
    const { data: sentenceRow } = await supabase
      .from('sentences')
      .select('text')
      .eq('id', activeRound.sentence_id)
      .single()

    return NextResponse.json({
      id: activeRound.id,
      sentenceText: sentenceRow?.text ?? '',
      mode: activeRound.mode,
      startedAt: activeRound.started_at,
      endedAt: activeRound.ended_at,
    })
  }

  const queryMode = mode === 'mixed' ? getRandomBaseMode() : mode
  const duration = DURATION_BY_MODE[mode]

  const { data: sentences, error: sentenceError } = await supabase
    .from('sentences')
    .select('id, text')
    .eq('mode', queryMode)

  if (sentenceError || !sentences || sentences.length === 0) {
    return NextResponse.json(
      { error: 'No sentences available', details: sentenceError?.message },
      { status: 500 },
    )
  }

  const sentence = sentences[Math.floor(Math.random() * sentences.length)]

  const startedAt = new Date()
  const endedAt = new Date(startedAt.getTime() + duration * 1000)

  const { data: newRound, error: roundError } = await supabase
    .from('game_rounds')
    .insert({
      sentence_id: sentence.id,
      mode,
      started_at: startedAt.toISOString(),
      ended_at: endedAt.toISOString(),
    })
    .select('id, mode, started_at, ended_at')
    .single()

  if (roundError || !newRound) {
    return NextResponse.json(
      { error: 'Failed to create round', details: roundError?.message },
      { status: 500 },
    )
  }

  return NextResponse.json({
    id: newRound.id,
    sentenceText: sentence.text,
    mode: newRound.mode,
    startedAt: newRound.started_at,
    endedAt: newRound.ended_at,
  })
}
