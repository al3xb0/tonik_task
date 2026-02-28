'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePlayerStore } from '@/stores/playerStore'
import type { Player } from '@/types/game'
import type { User } from '@supabase/supabase-js'

function generateAnonName(): string {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `Anonymous${num}`
}

async function loadPlayerFromDb(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  isAnon: boolean,
): Promise<Player | null> {
  try {
    const { data } = await supabase
      .from('players')
      .select('id, name, is_anonymous')
      .eq('id', userId)
      .single()

    if (data) {
      return { id: data.id, name: data.name, isAnonymous: isAnon }
    }

    const name = generateAnonName()
    const { data: created } = await supabase
      .from('players')
      .insert({ id: userId, name, is_anonymous: isAnon })
      .select('id, name, is_anonymous')
      .single()

    if (created) {
      return { id: created.id, name: created.name, isAnonymous: isAnon }
    }

    await new Promise((r) => setTimeout(r, 1000))
    const { data: retried } = await supabase
      .from('players')
      .select('id, name, is_anonymous')
      .eq('id', userId)
      .single()

    return retried
      ? { id: retried.id, name: retried.name, isAnonymous: isAnon }
      : null
  } catch (err) {
    console.error('loadPlayerFromDb error:', err)
    return null
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [player, setPlayer] = useState<Player | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { setLocalPlayer } = usePlayerStore()
  const initDone = useRef(false)

  const applyUser = useCallback(
    async (supabase: ReturnType<typeof createClient>, authUser: User) => {
      setUser(authUser)
      const p = await loadPlayerFromDb(
        supabase,
        authUser.id,
        authUser.is_anonymous ?? true,
      )
      if (p) {
        setPlayer(p)
        setLocalPlayer(p)
      }
    },
    [setLocalPlayer],
  )

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (cancelled) return

        let authUser = session?.user ?? null

        if (!authUser) {
          const { data } = await supabase.auth.signInAnonymously()
          authUser = data?.user ?? null
        }

        if (authUser && !cancelled) {
          await applyUser(supabase, authUser)
        }
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        if (!cancelled) {
          initDone.current = true
          setIsLoading(false)
        }
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (cancelled || !initDone.current) return

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setPlayer(null)
          setLocalPlayer(null as unknown as Player)
          return
        }

        if (session?.user) {
          await applyUser(supabase, session.user)
        }
      },
    )

    init()

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [setLocalPlayer, applyUser])

  const updatePlayerName = useCallback(
    async (name: string) => {
      if (!user) return

      const supabase = createClient()
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
    [user, player, setLocalPlayer],
  )

  const signOut = useCallback(async () => {
    const supabase = createClient()
    try {
      localStorage.removeItem('typeracer-player-settings')
    } catch {}
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch (err) {
      console.error('signOut error:', err)
    }
    try {
      const { data } = await supabase.auth.signInAnonymously()
      if (data?.user) {
        await applyUser(supabase, data.user)
      }
    } catch (err) {
      console.error('signInAnonymously after signOut error:', err)
    }
  }, [applyUser])

  return {
    user,
    player,
    isLoading,
    isAnonymous: user?.is_anonymous ?? true,
    updatePlayerName,
    signOut,
  }
}
