'use client'

import React from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'

export type NewsletterState = {
  status: 'idle' | 'success' | 'error'
  message?: string
}

interface NewsletterFormProps {
  action: (prevState: NewsletterState, formData: FormData) => Promise<NewsletterState>
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="rounded-full px-6" disabled={pending}>
      {pending ? 'Joining...' : 'Join the Brief'}
    </Button>
  )
}

export function NewsletterForm({ action }: NewsletterFormProps) {
  const [state, formAction] = useFormState(action, { status: 'idle' })

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="text-sm font-semibold text-foreground" htmlFor="email">
        Your email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        placeholder="you@example.com"
        className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton />
        {state.message && (
          <p
            className={`text-sm ${
              state.status === 'success' ? 'text-primary' : 'text-destructive'
            }`}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  )
}
