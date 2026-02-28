'use client'

import { useEffect, useState, useMemo } from 'react'
import { useQueryState, parseAsStringLiteral, parseAsInteger } from 'nuqs'
import { motion } from 'framer-motion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { usePlayerStore } from '@/stores/playerStore'

interface PlayerStat {
  id: string
  roundId: string
  wpm: number
  accuracy: number
  completed: boolean
  createdAt: string
  mode: string
  roundDate: string
}

type StatSortColumn = 'date' | 'mode' | 'wpm' | 'accuracy'

const statSortColumns = ['date', 'mode', 'wpm', 'accuracy'] as const
const sortOrders = ['asc', 'desc'] as const

function SortIcon({ active, order }: { active: boolean; order: string }) {
  if (!active) return <span className="ml-1 text-muted-foreground/30">↕</span>
  return <span className="ml-1">{order === 'asc' ? '↑' : '↓'}</span>
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function PlayerStatsTable() {
  const { localPlayer } = usePlayerStore()
  const [stats, setStats] = useState<PlayerStat[]>([])
  const [loading, setLoading] = useState(true)

  const [sort, setSort] = useQueryState(
    'statSort',
    parseAsStringLiteral(statSortColumns).withDefault('date'),
  )
  const [order, setOrder] = useQueryState(
    'statOrder',
    parseAsStringLiteral(sortOrders).withDefault('desc'),
  )
  const [pageSize, setPageSize] = useQueryState(
    'statPageSize',
    parseAsInteger.withDefault(10),
  )
  const [page, setPage] = useQueryState(
    'statPage',
    parseAsInteger.withDefault(1),
  )

  useEffect(() => {
    if (!localPlayer) return

    const fetchStats = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/stats/player?playerId=${localPlayer.id}`)
        if (res.ok) {
          setStats(await res.json())
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [localPlayer?.id])

  const handleSort = (column: StatSortColumn) => {
    if (sort === column) {
      setOrder(order === 'asc' ? 'desc' : 'asc')
    } else {
      setSort(column)
      setOrder(column === 'date' ? 'desc' : 'desc')
    }
    setPage(1)
  }

  const sorted = useMemo(() => {
    return [...stats].sort((a, b) => {
      let cmp = 0
      switch (sort) {
        case 'date':
          cmp = new Date(a.roundDate).getTime() - new Date(b.roundDate).getTime()
          break
        case 'mode':
          cmp = a.mode.localeCompare(b.mode)
          break
        case 'wpm':
          cmp = a.wpm - b.wpm
          break
        case 'accuracy':
          cmp = a.accuracy - b.accuracy
          break
      }
      return order === 'asc' ? cmp : -cmp
    })
  }, [stats, sort, order])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  const avgWpm = stats.length > 0 ? Math.round(stats.reduce((s, r) => s + r.wpm, 0) / stats.length) : 0
  const bestWpm = stats.length > 0 ? Math.max(...stats.map((r) => r.wpm)) : 0
  const avgAccuracy = stats.length > 0 ? (stats.reduce((s, r) => s + r.accuracy, 0) / stats.length) : 0
  const completedCount = stats.filter((r) => r.completed).length

  if (loading) {
    return (
      <div className="w-full space-y-3">
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-4"
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-2xl font-bold tabular-nums">{stats.length}</p>
          <p className="text-xs text-muted-foreground">Games Played</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-2xl font-bold tabular-nums text-primary">{bestWpm}</p>
          <p className="text-xs text-muted-foreground">Best WPM</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-2xl font-bold tabular-nums">{avgWpm}</p>
          <p className="text-xs text-muted-foreground">Avg WPM</p>
        </div>
        <div className="rounded-lg border bg-card p-3 text-center">
          <p className="text-2xl font-bold tabular-nums">{(avgAccuracy * 100).toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">Avg Accuracy</p>
        </div>
      </div>

      {stats.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground text-sm">
          No games played yet. Start a round to see your stats!
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('date')}>
                  Date
                  <SortIcon active={sort === 'date'} order={order} />
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => handleSort('mode')}>
                  Mode
                  <SortIcon active={sort === 'mode'} order={order} />
                </TableHead>
                <TableHead className="cursor-pointer select-none text-right" onClick={() => handleSort('wpm')}>
                  WPM
                  <SortIcon active={sort === 'wpm'} order={order} />
                </TableHead>
                <TableHead className="cursor-pointer select-none text-right" onClick={() => handleSort('accuracy')}>
                  Accuracy
                  <SortIcon active={sort === 'accuracy'} order={order} />
                </TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((stat) => (
                <TableRow key={stat.id}>
                  <TableCell className="text-sm">{formatDate(stat.roundDate)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">
                      {stat.mode}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{stat.wpm}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {(stat.accuracy * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-center">
                    {stat.completed ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <span className="text-muted-foreground">✗</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {completedCount}/{stats.length} completed
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, safePage - 1))}
                disabled={safePage <= 1}
                className="px-2 py-1 rounded hover:bg-muted disabled:opacity-30"
              >
                ←
              </button>
              <span className="tabular-nums">
                {safePage}/{totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                disabled={safePage >= totalPages}
                className="px-2 py-1 rounded hover:bg-muted disabled:opacity-30"
              >
                →
              </button>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => { setPageSize(parseInt(v, 10)); setPage(1) }}
              >
                <SelectTrigger className="w-17.5 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}
