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

interface LeaderboardEntry {
  playerId: string
  playerName: string
  bestWpm: number
  avgWpm: number
  avgAccuracy: number
  gamesPlayed: number
  gamesCompleted: number
}

type LbSortColumn = 'name' | 'bestWpm' | 'avgWpm' | 'avgAccuracy' | 'gamesPlayed'

const lbSortColumns = ['name', 'bestWpm', 'avgWpm', 'avgAccuracy', 'gamesPlayed'] as const
const sortOrders = ['asc', 'desc'] as const

function SortIcon({ active, order }: { active: boolean; order: string }) {
  if (!active) return <span className="ml-1 text-muted-foreground/30">↕</span>
  return <span className="ml-1">{order === 'asc' ? '↑' : '↓'}</span>
}

export function LeaderboardTable() {
  const { localPlayer } = usePlayerStore()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  const [sort, setSort] = useQueryState(
    'lbSort',
    parseAsStringLiteral(lbSortColumns).withDefault('bestWpm'),
  )
  const [order, setOrder] = useQueryState(
    'lbOrder',
    parseAsStringLiteral(sortOrders).withDefault('desc'),
  )
  const [pageSize, setPageSize] = useQueryState(
    'lbPageSize',
    parseAsInteger.withDefault(10),
  )

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/stats/leaderboard')
      if (res.ok) {
        setEntries(await res.json())
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const handleSort = (column: LbSortColumn) => {
    if (sort === column) {
      setOrder(order === 'asc' ? 'desc' : 'asc')
    } else {
      setSort(column)
      setOrder('desc')
    }
  }

  const sorted = useMemo(() => {
    return [...entries].sort((a, b) => {
      let cmp = 0
      switch (sort) {
        case 'name':
          cmp = a.playerName.localeCompare(b.playerName)
          break
        case 'bestWpm':
          cmp = a.bestWpm - b.bestWpm
          break
        case 'avgWpm':
          cmp = a.avgWpm - b.avgWpm
          break
        case 'avgAccuracy':
          cmp = a.avgAccuracy - b.avgAccuracy
          break
        case 'gamesPlayed':
          cmp = a.gamesPlayed - b.gamesPlayed
          break
      }
      return order === 'asc' ? cmp : -cmp
    })
  }, [entries, sort, order])

  const paginated = sorted.slice(0, pageSize)

  if (loading) {
    return (
      <div className="w-full space-y-3">
        <Skeleton className="h-10 w-full rounded-lg" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="w-full rounded-lg border bg-card p-8 text-center text-muted-foreground text-sm">
        No results yet. Be the first to play!
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-3"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12 text-center">#</TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => handleSort('name')}>
              Player
              <SortIcon active={sort === 'name'} order={order} />
            </TableHead>
            <TableHead className="cursor-pointer select-none text-right" onClick={() => handleSort('bestWpm')}>
              Best WPM
              <SortIcon active={sort === 'bestWpm'} order={order} />
            </TableHead>
            <TableHead className="cursor-pointer select-none text-right" onClick={() => handleSort('avgWpm')}>
              Avg WPM
              <SortIcon active={sort === 'avgWpm'} order={order} />
            </TableHead>
            <TableHead className="cursor-pointer select-none text-right" onClick={() => handleSort('avgAccuracy')}>
              Avg Accuracy
              <SortIcon active={sort === 'avgAccuracy'} order={order} />
            </TableHead>
            <TableHead className="cursor-pointer select-none text-right" onClick={() => handleSort('gamesPlayed')}>
              Games
              <SortIcon active={sort === 'gamesPlayed'} order={order} />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginated.map((entry, idx) => {
            const isMe = entry.playerId === localPlayer?.id
            const rank = idx + 1
            return (
              <motion.tr
                key={entry.playerId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`border-b transition-colors ${
                  isMe
                    ? 'bg-primary/5 hover:bg-primary/10'
                    : 'hover:bg-muted/50'
                }`}
              >
                <TableCell className="text-center font-mono tabular-nums">
                  {rank <= 3 ? (
                    <span className="text-lg">
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">{rank}</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className={isMe ? 'font-semibold' : ''}>
                      {entry.playerName}
                    </span>
                    {isMe && (
                      <Badge variant="secondary" className="text-xs">You</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums font-bold">
                  {entry.bestWpm}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {entry.avgWpm}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {(entry.avgAccuracy * 100).toFixed(1)}%
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {entry.gamesPlayed}
                </TableCell>
              </motion.tr>
            )
          })}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{entries.length} player{entries.length !== 1 && 's'}</span>
        <div className="flex items-center gap-2">
          <span>Show</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => setPageSize(parseInt(v, 10))}
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
    </motion.div>
  )
}
