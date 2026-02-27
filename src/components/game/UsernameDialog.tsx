'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface UsernameDialogProps {
  open: boolean
  onSubmit: (name: string) => Promise<void>
}

const NAME_REGEX = /^[a-zA-Z0-9\s]+$/
const MIN_LENGTH = 3
const MAX_LENGTH = 20

export function UsernameDialog({ open, onSubmit }: UsernameDialogProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const validate = (value: string): string => {
    if (value.length < MIN_LENGTH) return `At least ${MIN_LENGTH} characters`
    if (value.length > MAX_LENGTH) return `Maximum ${MAX_LENGTH} characters`
    if (!NAME_REGEX.test(value)) return 'Only letters, numbers and spaces'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    const validationError = validate(trimmed)
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(trimmed)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={() => {}}>
          <DialogContent
            showCloseButton={false}
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Welcome to TypeRacer!</DialogTitle>
                  <DialogDescription>
                    Choose a name to get started. Other players will see this name.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      setError('')
                    }}
                    maxLength={MAX_LENGTH}
                    autoFocus
                  />
                  {error && (
                    <p className="text-sm text-red-500 mt-1">{error}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Start Playing'}
                  </Button>
                </DialogFooter>
              </form>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  )
}
