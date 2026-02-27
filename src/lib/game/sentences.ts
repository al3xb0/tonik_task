import { createClient } from '@/lib/supabase/client'
import type { GameMode, Difficulty } from '@/types/game'

export interface Sentence {
  id: string
  text: string
  mode: GameMode
  difficulty: Difficulty
}

/**
 * Fetches a random sentence from Supabase for the given mode.
 * Uses Supabase's built-in random ordering with limit 1.
 */
export async function getRandomSentence(mode: GameMode): Promise<Sentence> {
  const supabase = createClient()

  const queryMode = mode === 'mixed' ? getRandomBaseMode() : mode

  const { data, error } = await supabase
    .from('sentences')
    .select('id, text, mode, difficulty')
    .eq('mode', queryMode)
    .limit(1)
    .order('id', { ascending: false }) // Use a stable order to get a random sentence with limit 1
    .single()

  if (error || !data) {
    throw new Error(`Failed to fetch sentence for mode "${queryMode}": ${error?.message}`)
  }

  return {
    id: data.id,
    text: data.text,
    mode: data.mode as GameMode,
    difficulty: data.difficulty as Difficulty,
  }
}

/**
 * Fetches a random sentence text for the given mode.
 * For 'mixed' mode, picks a random base mode first.
 */
export async function getSentenceForMode(mode: GameMode): Promise<string> {
  const sentence = await getRandomSentence(mode)
  return sentence.text
}

/**
 * Returns a random base mode (excluding 'mixed').
 */
function getRandomBaseMode(): Exclude<GameMode, 'mixed'> {
  const modes: Exclude<GameMode, 'mixed'>[] = ['words', 'sentences', 'text']
  return modes[Math.floor(Math.random() * modes.length)]
}
