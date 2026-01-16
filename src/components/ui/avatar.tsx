'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

type AvatarStatus = 'loading' | 'error' | 'loaded'

const AvatarContext = React.createContext<{
  status: AvatarStatus
  setStatus: (status: AvatarStatus) => void
} | null>(null)

const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const [status, setStatus] = React.useState<AvatarStatus>('loading')

    return (
      <AvatarContext.Provider value={{ status, setStatus }}>
        <div
          ref={ref}
          className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
          {...props}
        />
      </AvatarContext.Provider>
    )
  },
)
Avatar.displayName = 'Avatar'

const AvatarImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ className, src, ...props }, ref) => {
    const context = React.useContext(AvatarContext)

    // Reset status when src changes
    React.useEffect(() => {
      if (context) {
        if (!src) {
          context.setStatus('error')
        } else {
          context.setStatus('loading')
        }
      }
    }, [src, context])

    const handleLoad = React.useCallback(() => {
      context?.setStatus('loaded')
    }, [context])

    const handleError = React.useCallback(() => {
      context?.setStatus('error')
    }, [context])

    if (!context) {
      return <img ref={ref} className={className} src={src} {...props} />
    }

    // If error, don't render image at all
    if (context.status === 'error') {
      return null
    }

    return (
      <img
        ref={ref}
        src={src}
        onLoad={handleLoad}
        onError={handleError}
        className={cn('aspect-square h-full w-full object-cover', className)}
        {...props}
      />
    )
  },
)
AvatarImage.displayName = 'AvatarImage'

const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const context = React.useContext(AvatarContext)

    if (context && context.status === 'loaded') {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex h-full w-full items-center justify-center rounded-full bg-muted',
          className,
        )}
        {...props}
      />
    )
  },
)
AvatarFallback.displayName = 'AvatarFallback'

export { Avatar, AvatarImage, AvatarFallback }
