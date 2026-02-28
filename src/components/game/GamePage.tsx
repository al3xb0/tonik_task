'use client'

import { useAuth } from '@/hooks/useAuth'
import { useGameRound } from '@/hooks/useGameRound'
import { useRealtimePlayers } from '@/hooks/useRealtimePlayers'
import { useGameStore } from '@/stores/gameStore'
import { RoundTimer } from '@/components/game/RoundTimer'
import { ModeSelector } from '@/components/game/ModeSelector'
import { TypingInput } from '@/components/game/TypingInput'
import { ProgressTable } from '@/components/game/ProgressTable'
import { UsernameDialog } from '@/components/game/UsernameDialog'
import { AuthDialog } from '@/components/auth/AuthDialog'
import { Button } from '@/components/ui/button'

export function GamePage() {
  const { player, isLoading, isAnonymous, updatePlayerName, signOut } = useAuth()
  const { startRound, exitRound } = useGameRound({ enabled: !isLoading && !!player })
  const phase = useGameStore((s) => s.phase)
  useRealtimePlayers()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-lg">Loading...</p>
      </div>
    )
  }

  const showUsernameDialog = player?.name === 'Anonymous'

  return (
    <div className="min-h-screen bg-background">
      <UsernameDialog
        open={showUsernameDialog}
        onSubmit={async (name) => {
          await updatePlayerName(name)
        }}
      />

      <div className="mx-auto max-w-3xl px-4 py-8">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold tracking-tight">TypeRacer</h1>
          <div className="flex items-center gap-3">
            {player && (
              <span className="text-sm text-muted-foreground">
                {player.name}
              </span>
            )}
            {isAnonymous ? (
              <AuthDialog isAnonymous={isAnonymous} playerName={player?.name} />
            ) : (
              <Button variant="outline" size="sm" onClick={signOut}>
                Logout
              </Button>
            )}
          </div>
        </header>

        <div className="flex flex-col items-center gap-6">
          <ModeSelector />

          {phase === 'waiting' && (
            <Button size="lg" onClick={startRound}>
              Start Round
            </Button>
          )}

          {phase === 'active' && (
            <>
              <RoundTimer />
              <TypingInput />
              <ProgressTable />
              <Button variant="outline" size="sm" onClick={exitRound}>
                Exit Round
              </Button>
            </>
          )}

          {phase === 'results' && (
            <>
              <RoundTimer />
              <ProgressTable />
              <div className="flex gap-3">
                <Button size="lg" onClick={startRound}>
                  Next Round
                </Button>
                <Button variant="outline" size="lg" onClick={exitRound}>
                  Exit
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
