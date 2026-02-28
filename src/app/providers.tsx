'use client'

import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <NuqsAdapter>{children}</NuqsAdapter>
    </ErrorBoundary>
  )
}
