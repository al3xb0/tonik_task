'use client'

import { useMemo } from 'react'
import { useQueryState, parseAsStringLiteral, parseAsInteger } from 'nuqs'
import { motion, AnimatePresence } from 'framer-motion'
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
import { usePlayerStore } from '@/stores/playerStore'
import { useGameStore } from '@/stores/gameStore'
import type { Competitor, SortColumn, SortOrder } from '@/types/game'

const sortColumns = ['name', 'wpm', 'accuracy', 'progress'] as const
const sortOrders = ['asc', 'desc'] as const

function getProgress(competitor: Competitor, targetLength: number): number {
  if (targetLength === 0) return 0
  return Math.min(100, Math.round((competitor.typedText.length / targetLength) * 100))
}

function sortCompetitors(
  competitors: Competitor[],
  column: SortColumn,
  order: SortOrder,
  targetLength: number,
): Competitor[] {
  const sorted = [...competitors].sort((a, b) => {
    let cmp = 0
    switch (column) {
      case 'name':
        cmp = a.player.name.localeCompare(b.player.name)
        break
      case 'wpm':
        cmp = a.wpm - b.wpm
        break
      case 'accuracy':
        cmp = a.accuracy - b.accuracy
        break
      case 'progress':
        cmp = getProgress(a, targetLength) - getProgress(b, targetLength)
        break
    }
    return order === 'asc' ? cmp : -cmp
  })
  return sorted
}

function SortIcon({ active, order }: { active: boolean; order: SortOrder }) {
  if (!active) return <span className="ml-1 text-muted-foreground/30">↕</span>
  return <span className="ml-1">{order === 'asc' ? '↑' : '↓'}</span>
}

export function ProgressTable() {
  const { competitors, localPlayer } = usePlayerStore()
  const currentRound = useGameStore((s) => s.currentRound)
  const targetLength = currentRound?.sentenceText.length ?? 0

  const [sort, setSort] = useQueryState(
    'sort',
    parseAsStringLiteral(sortColumns).withDefault('wpm'),
  )
  const [order, setOrder] = useQueryState(
    'order',
    parseAsStringLiteral(sortOrders).withDefault('desc'),
  )
  const [pageSize, setPageSize] = useQueryState(
    'pageSize',
    parseAsInteger.withDefault(10),
  )

  const handleSort = (column: SortColumn) => {
    if (sort === column) {
      setOrder(order === 'asc' ? 'desc' : 'asc')
    } else {
      setSort(column)
      setOrder('desc')
    }
  }

  const sorted = useMemo(
    () => sortCompetitors(competitors, sort, order, targetLength),
    [competitors, sort, order, targetLength],
  )

  const paginated = useMemo(
    () => sorted.slice(0, pageSize),
    [sorted, pageSize],
  )

  if (competitors.length === 0) {
    return (
      <div className="w-full rounded-lg border bg-card p-6 text-center text-muted-foreground text-sm">
        No players yet. Start typing to appear here.
      </div>
    )
  }

  return (
    <div className="w-full space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer select-none w-[35%]"
              onClick={() => handleSort('progress')}
            >
              Progress
              <SortIcon active={sort === 'progress'} order={order} />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort('name')}
            >
              Player
              <SortIcon active={sort === 'name'} order={order} />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none text-right"
              onClick={() => handleSort('wpm')}
            >
              WPM
              <SortIcon active={sort === 'wpm'} order={order} />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none text-right"
              onClick={() => handleSort('accuracy')}
            >
              Accuracy
              <SortIcon active={sort === 'accuracy'} order={order} />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="popLayout">
            {paginated.map((c) => {
              const isMe = c.player.id === localPlayer?.id
              const progress = getProgress(c, targetLength)
              const previewText = c.typedText.slice(0, 20)
              return (
                <motion.tr
                  key={c.player.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={`border-b transition-colors ${
                    isMe
                      ? 'bg-primary/5 hover:bg-primary/10'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <TableCell className="py-3">
                    <div className="flex flex-col gap-1">
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            c.isCompleted ? 'bg-green-500' : 'bg-primary'
                          }`}
                          initial={false}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
                        {previewText}
                        {c.typedText.length > 20 && '…'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <span className={isMe ? 'font-semibold' : ''}>
                        {c.player.name}
                      </span>
                      {isMe && (
                        <Badge variant="secondary" className="text-xs">
                          You
                        </Badge>
                      )}
                      {c.isCompleted && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          Done
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-right font-mono tabular-nums">
                    {c.wpm}
                  </TableCell>
                  <TableCell className="py-3 text-right font-mono tabular-nums">
                    {(c.accuracy * 100).toFixed(1)}%
                  </TableCell>
                </motion.tr>
              )
            })}
          </AnimatePresence>
        </TableBody>
      </Table>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {competitors.length} player{competitors.length !== 1 && 's'}
        </span>
        <div className="flex items-center gap-2">
          <span>Show</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => setPageSize(parseInt(v, 10))}
          >
            <SelectTrigger className="w-[70px] h-8">
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
    </div>
  )
}
