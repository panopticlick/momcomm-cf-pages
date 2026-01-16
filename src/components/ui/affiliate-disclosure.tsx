import { ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AffiliateDisclosureProps {
  variant?: 'inline' | 'compact' | 'full'
  className?: string
}

export function AffiliateDisclosure({ variant = 'inline', className }: AffiliateDisclosureProps) {
  if (variant === 'compact') {
    return (
      <div className={cn('text-xs text-muted-foreground', className)}>
        <span className="inline-flex items-center gap-1">
          Affiliate Link
          <ExternalLink className="w-3 h-3" />
        </span>
      </div>
    )
  }

  if (variant === 'full') {
    return (
      <div
        className={cn(
          'bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg p-4 text-sm',
          className,
        )}
      >
        <div className="flex items-start gap-2">
          <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs uppercase tracking-wide shrink-0">
            Disclosure:
          </span>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            This post contains affiliate links. If you make a purchase through these links, we may
            earn a commission at no additional cost to you. We only recommend products or services
            we genuinely believe will add value to our readers. All opinions are our own.
          </p>
        </div>
      </div>
    )
  }

  // inline (default)
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1',
        className,
      )}
    >
      <span>Affiliate links may earn a commission.</span>
      <a
        href="/meta/legal#affiliate-disclosure"
        className="inline-flex items-center gap-0.5 hover:underline"
      >
        Learn more
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  )
}
