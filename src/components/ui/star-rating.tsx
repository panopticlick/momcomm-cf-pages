import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating?: number | null
  reviewCount?: number | null
  showCount?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function StarRating({
  rating,
  reviewCount,
  showCount = true,
  size = 'sm',
  className,
}: StarRatingProps) {
  if (!rating || rating <= 0) {
    return showCount ? <span className="text-xs text-muted-foreground">No reviews</span> : null
  }

  const normalizedRating = Math.min(5, Math.max(0, rating))
  const fullStars = Math.floor(normalizedRating)
  const hasHalfStar = normalizedRating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star
            key={`full-${i}`}
            className={cn('fill-amber-400 text-amber-400', sizeClasses[size])}
          />
        ))}
        {hasHalfStar && (
          <div className="relative">
            <Star className={cn('text-amber-400', sizeClasses[size])} />
            <Star
              className={cn(
                'fill-amber-400 text-amber-400 absolute left-0 top-0 w-1/2 overflow-hidden',
                sizeClasses[size],
              )}
            />
          </div>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={cn('text-gray-300 dark:text-gray-600', sizeClasses[size])}
          />
        ))}
      </div>
      {showCount && reviewCount !== undefined && reviewCount !== null && (
        <span className="text-xs text-muted-foreground">({reviewCount.toLocaleString()})</span>
      )}
    </div>
  )
}
