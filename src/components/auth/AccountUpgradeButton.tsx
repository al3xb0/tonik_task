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

interface AccountUpgradeButtonProps {
  isAnonymous: boolean
}

export function AccountUpgradeButton({
  isAnonymous,
}: AccountUpgradeButtonProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!isAnonymous) return null

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const supabase = createClient()

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

      setSuccess(true)
      setTimeout(() => setOpen(false), 1500)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Save my account
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleUpgrade}>
            <DialogHeader>
              <DialogTitle>Save your account</DialogTitle>
              <DialogDescription>
                Add email and password to keep your stats permanently.
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
              {success && (
                <p className="text-sm text-green-500">
                  Account saved successfully!
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="submit" disabled={submitting || success}>
                {submitting ? 'Saving...' : 'Upgrade Account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
