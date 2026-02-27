import { describe, it, expect, beforeEach } from 'vitest'
import { usePlayerStore } from '../playerStore'

describe('playerStore', () => {
  beforeEach(() => {
    usePlayerStore.setState({
      localPlayer: null,
      competitors: [],
      tableSort: {
        sortColumn: 'wpm',
        sortOrder: 'desc',
        pageSize: 10,
        page: 1,
      },
    })
  })

  describe('upsertCompetitor', () => {
    it('adds a new competitor when playerId does not exist', () => {
      usePlayerStore.getState().upsertCompetitor({
        playerId: 'player-1',
        playerName: 'Alice',
        wpm: 50,
        accuracy: 0.95,
        typedText: 'hello',
      })

      const competitors = usePlayerStore.getState().competitors
      expect(competitors).toHaveLength(1)
      expect(competitors[0].player.id).toBe('player-1')
      expect(competitors[0].player.name).toBe('Alice')
      expect(competitors[0].wpm).toBe(50)
      expect(competitors[0].accuracy).toBe(0.95)
      expect(competitors[0].typedText).toBe('hello')
      expect(competitors[0].isCompleted).toBe(false)
    })

    it('updates an existing competitor by playerId', () => {
      usePlayerStore.getState().upsertCompetitor({
        playerId: 'player-1',
        playerName: 'Alice',
        wpm: 50,
        accuracy: 0.95,
        typedText: 'hello',
      })

      usePlayerStore.getState().upsertCompetitor({
        playerId: 'player-1',
        wpm: 75,
        accuracy: 0.98,
        typedText: 'hello world',
      })

      const competitors = usePlayerStore.getState().competitors
      expect(competitors).toHaveLength(1)
      expect(competitors[0].player.id).toBe('player-1')
      expect(competitors[0].player.name).toBe('Alice') // name should remain unchanged
      expect(competitors[0].wpm).toBe(75)
      expect(competitors[0].accuracy).toBe(0.98)
      expect(competitors[0].typedText).toBe('hello world')
    })

    it('adds multiple distinct competitors', () => {
      usePlayerStore.getState().upsertCompetitor({
        playerId: 'player-1',
        playerName: 'Alice',
        wpm: 50,
      })
      usePlayerStore.getState().upsertCompetitor({
        playerId: 'player-2',
        playerName: 'Bob',
        wpm: 60,
      })

      const competitors = usePlayerStore.getState().competitors
      expect(competitors).toHaveLength(2)
      expect(competitors[0].player.name).toBe('Alice')
      expect(competitors[1].player.name).toBe('Bob')
    })

    it('defaults to Anonymous name when playerName not provided', () => {
      usePlayerStore.getState().upsertCompetitor({
        playerId: 'player-1',
        wpm: 30,
      })

      const competitors = usePlayerStore.getState().competitors
      expect(competitors[0].player.name).toBe('Anonymous')
    })
  })

  describe('removeCompetitor', () => {
    it('removes the correct competitor by playerId', () => {
      usePlayerStore.getState().upsertCompetitor({
        playerId: 'player-1',
        playerName: 'Alice',
      })
      usePlayerStore.getState().upsertCompetitor({
        playerId: 'player-2',
        playerName: 'Bob',
      })

      usePlayerStore.getState().removeCompetitor('player-1')

      const competitors = usePlayerStore.getState().competitors
      expect(competitors).toHaveLength(1)
      expect(competitors[0].player.id).toBe('player-2')
      expect(competitors[0].player.name).toBe('Bob')
    })

    it('does nothing when playerId does not exist', () => {
      usePlayerStore.getState().upsertCompetitor({
        playerId: 'player-1',
        playerName: 'Alice',
      })

      usePlayerStore.getState().removeCompetitor('non-existent')

      expect(usePlayerStore.getState().competitors).toHaveLength(1)
    })
  })

  describe('clearCompetitors', () => {
    it('removes all competitors', () => {
      usePlayerStore.getState().upsertCompetitor({ playerId: 'p1', playerName: 'A' })
      usePlayerStore.getState().upsertCompetitor({ playerId: 'p2', playerName: 'B' })

      usePlayerStore.getState().clearCompetitors()

      expect(usePlayerStore.getState().competitors).toHaveLength(0)
    })
  })

  describe('setLocalPlayer', () => {
    it('sets the local player', () => {
      usePlayerStore.getState().setLocalPlayer({
        id: 'my-id',
        name: 'Me',
        isAnonymous: false,
      })

      const player = usePlayerStore.getState().localPlayer
      expect(player).not.toBeNull()
      expect(player!.id).toBe('my-id')
      expect(player!.name).toBe('Me')
    })
  })

  describe('setTableSort', () => {
    it('partially updates table sort state', () => {
      usePlayerStore.getState().setTableSort({ sortColumn: 'accuracy', page: 2 })

      const sort = usePlayerStore.getState().tableSort
      expect(sort.sortColumn).toBe('accuracy')
      expect(sort.page).toBe(2)
      expect(sort.sortOrder).toBe('desc') // unchanged
      expect(sort.pageSize).toBe(10) // unchanged
    })
  })
})
