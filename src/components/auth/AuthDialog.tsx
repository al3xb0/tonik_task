'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

type AuthMode = 'login' | 'register'

interface AuthDialogProps {
  isAnonymous: boolean
  playerName?: string
}

export function AuthDialog({ isAnonymous, playerName }: AuthDialogProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isAnonymous) return null

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setError('')
    setSubmitting(false)
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const supabase = createClient()

    try {
      if (mode === 'register') {
        const { error: updateError } = await supabase.auth.updateUser({
          email,
          password,
        })

        if (updateError) {
          setError(updateError.message)
          return
        }

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          await supabase
            .from('players')
            .update({ is_anonymous: false })
            .eq('id', user.id)
        }

        toast.success('Account created!')
        setOpen(false)
        resetForm()
      } else {
        await supabase.auth.signOut({ scope: 'local' })

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (signInError) {
          await supabase.auth.signInAnonymously()
          setError(signInError.message)
          return
        }

        toast.success('Logged in!')
        setOpen(false)
        resetForm()
      }
    } catch (err) {
      console.error('Auth submit error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setMode('login')
          resetForm()
          setOpen(true)
        }}
      >
        Login
      </Button>
      <Button
        size="sm"
        onClick={() => {
          setMode('register')
          resetForm()
          setOpen(true)
        }}
      >
        Register
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {mode === 'login' ? 'Login' : 'Create Account'}
              </DialogTitle>
              <DialogDescription>
                {mode === 'login'
                  ? 'Sign in to your existing account.'
                  : 'Save your anonymous session as a permanent account.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <Input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <button
                type="button"
                className="text-sm text-muted-foreground underline hover:text-foreground"
                onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              >
                {mode === 'login'
                  ? "Don't have an account? Register"
                  : 'Already have an account? Login'}
              </button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? 'Please wait...'
                  : mode === 'login'
                    ? 'Login'
                    : 'Register'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
