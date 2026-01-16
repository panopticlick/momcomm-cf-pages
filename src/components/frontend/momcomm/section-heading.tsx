import React from 'react'
import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  kicker?: string
  title: string
  subtitle?: string
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeading({
  kicker,
  title,
  subtitle,
  align = 'left',
  className,
}: SectionHeadingProps) {
  const alignment = align === 'center' ? 'text-center items-center' : 'text-left items-start'

  return (
    <div className={cn('flex flex-col gap-3', alignment, className)}>
      {kicker && (
        <span className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
          {kicker}
        </span>
      )}
      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
        {title}
      </h2>
      {subtitle && (
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl">{subtitle}</p>
      )}
    </div>
  )
}
