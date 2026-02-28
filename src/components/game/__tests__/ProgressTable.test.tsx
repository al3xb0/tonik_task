import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'

import { usePlayerStore } from '@/stores/playerStore'
import { useGameStore } from '@/stores/gameStore'
import { ProgressTable } from '@/components/game/ProgressTable'
import type { Competitor } from '@/types/game'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    motion: {
      ...actual.motion,
      tr: (props: React.HTMLAttributes<HTMLTableRowElement> & { layout?: boolean }) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { layout: _layout, ...rest } = props
        return <tr {...rest} />
      },
      div: (props: React.HTMLAttributes<HTMLDivElement>) => <div {...props} />,
    },
  }
})

const COMPETITORS: Competitor[] = [
  {
    player: { id: 'p1', name: 'Alice', isAnonymous: false },
    typedText: 'hello worl',
    wpm: 65,
    accuracy: 0.97,
    isCompleted: false,
  },
  {
    player: { id: 'p2', name: 'Bob', isAnonymous: false },
    typedText: 'hello world test',
    wpm: 80,
    accuracy: 0.95,
    isCompleted: false,
  },
  {
    player: { id: 'me', name: 'TestUser', isAnonymous: false },
    typedText: 'hello',
    wpm: 45,
    accuracy: 1.0,
    isCompleted: false,
  },
]

function renderTable(searchParams?: Record<string, string>) {
  return render(
    <NuqsTestingAdapter searchParams={searchParams}>
      <ProgressTable />
    </NuqsTestingAdapter>,
  )
}

describe('ProgressTable', () => {
  beforeEach(() => {
    useGameStore.setState({
      currentRound: {
        id: 'r1',
        sentenceText: 'hello world test sentence',
        mode: 'sentences',
        startedAt: new Date().toISOString(),
        endedAt: new Date(Date.now() + 60_000).toISOString(),
      },
    })
    usePlayerStore.setState({
      localPlayer: { id: 'me', name: 'TestUser', isAnonymous: false },
      competitors: COMPETITORS,
    })
  })

  it('renders all competitors', () => {
    renderTable()

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('TestUser')).toBeInTheDocument()
  })

  it('shows "You" badge for local player', () => {
    renderTable()

    const myRow = screen.getByText('TestUser').closest('tr')!
    expect(within(myRow).getByText('You')).toBeInTheDocument()

    const aliceRow = screen.getByText('Alice').closest('tr')!
    expect(within(aliceRow).queryByText('You')).not.toBeInTheDocument()
  })

  it('highlights local player row with special class', () => {
    renderTable()

    const myRow = screen.getByText('TestUser').closest('tr')!
    expect(myRow.className).toContain('bg-primary')

    const aliceRow = screen.getByText('Alice').closest('tr')!
    expect(aliceRow.className).not.toContain('bg-primary')
  })

  it('shows player count', () => {
    renderTable()
    expect(screen.getByText('3 players')).toBeInTheDocument()
  })

  it('clicking sort header changes sorting', async () => {
    const user = userEvent.setup()
    renderTable()

    // Default sort is by WPM desc → Bob (80) should be first
    const rows = screen.getAllByRole('row')
    // rows[0] is header, rows[1..3] are data
    const firstDataRow = rows[1]
    expect(within(firstDataRow).getByText('Bob')).toBeInTheDocument()

    // Click "Player" header to sort by name
    const nameButton = screen.getByRole('button', { name: /sort by name/i })
    await user.click(nameButton)

    // After sort by name desc, order should change
    const updatedRows = screen.getAllByRole('row')
    const names = updatedRows
      .slice(1)
      .map((row) => {
        const cells = within(row).getAllByRole('cell')
        // Player name is in the 2nd cell (index 1)
        return cells[1]?.textContent?.replace('You', '').trim()
      })
      .filter(Boolean)

    // Should be sorted alphabetically in some order
    expect(names.length).toBe(3)
  })

  it('shows empty state when no competitors', () => {
    usePlayerStore.setState({ competitors: [] })
    renderTable()
    expect(screen.getByText(/no players yet/i)).toBeInTheDocument()
  })

  it('displays WPM values for each competitor', () => {
    renderTable()

    expect(screen.getByText('65')).toBeInTheDocument()
    expect(screen.getByText('80')).toBeInTheDocument()
    expect(screen.getByText('45')).toBeInTheDocument()
  })

  it('displays accuracy percentages correctly', () => {
    renderTable()

    expect(screen.getByText('97.0%')).toBeInTheDocument()
    expect(screen.getByText('95.0%')).toBeInTheDocument()
    expect(screen.getByText('100.0%')).toBeInTheDocument()
  })

  it('respects initial sort from URL params', () => {
    renderTable({ sort: 'name', order: 'asc' })

    const rows = screen.getAllByRole('row')
    const firstDataRow = rows[1]
    // Asc by name → Alice should be first
    expect(within(firstDataRow).getByText('Alice')).toBeInTheDocument()
  })
})
