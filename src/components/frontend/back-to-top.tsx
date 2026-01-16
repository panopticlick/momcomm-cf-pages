'use client'

import { Button } from '@/components/ui/button'
import { ArrowUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)

    return () => {
      window.removeEventListener('scroll', toggleVisibility)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <div
      className={cn(
        'fixed bottom-8 right-8 z-50 transition-all duration-300',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
      )}
    >
      <Button
        size="icon"
        className="rounded-full shadow-lg h-12 w-12 bg-primary/90 hover:bg-primary transition-all hover:scale-110"
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        <ArrowUp className="h-6 w-6" />
      </Button>
    </div>
  )
}
