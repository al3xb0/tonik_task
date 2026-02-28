'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePlayerStore } from '@/stores/playerStore'
import type { Player } from '@/types/game'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [player, setPlayer] = useState<Player | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { setLocalPlayer } = usePlayerStore()

  const supabase = createClient()

  const loadPlayer = useCallback(
    async (userId: string, isAnon = true): Promise<Player | null> => {
      const { data } = await supabase
        .from('players')
        .select('id, name, is_anonymous')
        .eq('id', userId)
        .single()

      if (data) {
        const p: Player = {
          id: data.id,
          name: data.name,
          isAnonymous: data.is_anonymous,
        }
        setPlayer(p)
        setLocalPlayer(p)
        return p
      }

      const { data: created } = await supabase
        .from('players')
        .insert({ id: userId, name: 'Anonymous', is_anonymous: isAnon })
        .select('id, name, is_anonymous')
        .single()

      if (created) {
        const p: Player = {
          id: created.id,
          name: created.name,
          isAnonymous: created.is_anonymous,
        }
        setPlayer(p)
        setLocalPlayer(p)
        return p
      }

      await new Promise((r) => setTimeout(r, 1000))
      const { data: retried } = await supabase
        .from('players')
        .select('id, name, is_anonymous')
        .eq('id', userId)
        .single()

      if (retried) {
        const p: Player = {
          id: retried.id,
          name: retried.name,
          isAnonymous: retried.is_anonymous,
        }
        setPlayer(p)
        setLocalPlayer(p)
        return p
      }

      return null
    },
    [supabase, setLocalPlayer],
  )

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          setUser(session.user)
          await loadPlayer(session.user.id, session.user.is_anonymous ?? true)
        } else {
          const {
            data: { user: anonUser },
          } = await supabase.auth.signInAnonymously()

          if (anonUser) {
            setUser(anonUser)
            await loadPlayer(anonUser.id, true)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        await loadPlayer(session.user.id)
      } else {
        setUser(null)
        setPlayer(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, loadPlayer])

  const updatePlayerName = useCallback(
    async (name: string) => {
      if (!user) return

      const { error } = await supabase
        .from('players')
        .update({ name })
        .eq('id', user.id)

      if (!error) {
        const updated: Player = {
          id: user.id,
          name,
          isAnonymous: player?.isAnonymous ?? true,
        }
        setPlayer(updated)
        setLocalPlayer(updated)
      }

      return error
    },
    [user, player, supabase, setLocalPlayer],
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut({ scope: 'local' })
    setUser(null)
    setPlayer(null)
    setLocalPlayer(null as unknown as Player)
    try {
      localStorage.removeItem('player-store')
    } catch {}
    window.location.reload()
  }, [supabase, setLocalPlayer])

  return {
    user,
    player,
    isLoading,
    isAnonymous: user?.is_anonymous ?? true,
    updatePlayerName,
    signOut,
  }
}
