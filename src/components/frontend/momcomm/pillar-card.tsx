'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type PillarTone = 'gear' | 'stack' | 'ventures'

const toneStyles: Record<PillarTone, { card: string; badge: string }> = {
  gear: {
    card: 'bg-white/80 border-primary/20 shadow-lg shadow-primary/10',
    badge: 'bg-primary/15 text-primary',
  },
  stack: {
    card: 'bg-white/80 border-accent/20 shadow-lg shadow-accent/10',
    badge: 'bg-accent/15 text-accent',
  },
  ventures: {
    card: 'bg-white/80 border-foreground/10 shadow-lg shadow-foreground/10',
    badge: 'bg-foreground/10 text-foreground',
  },
}

interface PillarCardProps {
  title: string
  description: string
  href: string
  tone: PillarTone
  highlights: string[]
}

export function PillarCard({ title, description, href, tone, highlights }: PillarCardProps) {
  const styles = toneStyles[tone]

  return (
    <Link
      href={href}
      className={cn(
        'group flex h-full flex-col justify-between rounded-3xl border px-6 py-6 transition-all hover:-translate-y-1',
        styles.card,
      )}
    >
      <div className="space-y-4">
        <span
          className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold', styles.badge)}
        >
          {title}
        </span>
        <p className="text-lg font-semibold text-foreground leading-tight">{description}</p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {highlights.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground/50" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
        Explore {title}
        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}
