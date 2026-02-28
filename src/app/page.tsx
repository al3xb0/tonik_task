import { Suspense } from 'react'
import { GamePage } from '@/components/game/GamePage'
import { Skeleton } from '@/components/ui/skeleton'

function GameSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Skeleton className="h-8 w-32 rounded-lg" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-20 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-10 w-72 rounded-lg mb-6" />
        <div className="flex flex-col items-center gap-6">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<GameSkeleton />}>
      <GamePage />
    </Suspense>
  )
}
