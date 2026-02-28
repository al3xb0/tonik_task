'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useGameRound } from '@/hooks/useGameRound'
import { useRealtimePlayers } from '@/hooks/useRealtimePlayers'
import { useGameStore } from '@/stores/gameStore'
import { RoundTimer } from '@/components/game/RoundTimer'
import { ModeSelector } from '@/components/game/ModeSelector'
import { TypingInput } from '@/components/game/TypingInput'
import { ProgressTable } from '@/components/game/ProgressTable'
import { RoundResults } from '@/components/game/RoundResults'
import { PlayerStatsTable } from '@/components/stats/PlayerStatsTable'
import { LeaderboardTable } from '@/components/stats/LeaderboardTable'
import { UsernameDialog } from '@/components/game/UsernameDialog'
import { AuthDialog } from '@/components/auth/AuthDialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function GamePage() {
  const { player, isLoading, isAnonymous, updatePlayerName, signOut } = useAuth()
  const { startRound, exitRound } = useGameRound({ enabled: !isLoading && !!player })
  const phase = useGameStore((s) => s.phase)
  const [nameDialogOpen, setNameDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('game')
  const [statsKey, setStatsKey] = useState(0)
  useRealtimePlayers()

  const handleSignOut = async () => {
    exitRound()
    await signOut()
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (tab === 'stats' || tab === 'leaderboard') {
      setStatsKey((k) => k + 1)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-lg">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <UsernameDialog
        open={nameDialogOpen}
        currentName={player?.name}
        onSubmit={async (name) => {
          await updatePlayerName(name)
        }}
        onClose={() => setNameDialogOpen(false)}
      />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold tracking-tight">TypeRacer</h1>
          <div className="flex items-center gap-3">
            {player && (
              <button
                onClick={() => setNameDialogOpen(true)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Click to change name"
              >
                {player.name} ✏️
              </button>
            )}
            {isAnonymous ? (
              <AuthDialog isAnonymous={isAnonymous} playerName={player?.name} />
            ) : (
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Logout
              </Button>
            )}
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="game">Game</TabsTrigger>
            <TabsTrigger value="stats">My Stats</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="game">
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
                  <RoundResults />
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
          </TabsContent>

          <TabsContent value="stats">
            <PlayerStatsTable key={`stats-${statsKey}`} />
          </TabsContent>

          <TabsContent value="leaderboard">
            <LeaderboardTable key={`lb-${statsKey}`} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
