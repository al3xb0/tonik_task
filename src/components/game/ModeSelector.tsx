'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useGameStore } from '@/stores/gameStore'
import type { GameMode } from '@/types/game'

const MODES: { value: GameMode; label: string }[] = [
  { value: 'words', label: 'Words' },
  { value: 'sentences', label: 'Sentences' },
  { value: 'text', label: 'Text' },
  { value: 'mixed', label: 'Mixed' },
]

export function ModeSelector() {
  const { selectedMode, setSelectedMode, phase } = useGameStore()
  const disabled = phase === 'active'

  return (
    <Tabs
      value={selectedMode}
      onValueChange={(value) => setSelectedMode(value as GameMode)}
    >
      <TabsList>
        {MODES.map(({ value, label }) => (
          <TabsTrigger key={value} value={value} disabled={disabled}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
