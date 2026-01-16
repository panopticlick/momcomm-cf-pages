'use client'

import React from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  baseUrl?: string
}

export function Pagination({ currentPage, totalPages, baseUrl: _baseUrl }: PaginationProps) {
  const searchParams = useSearchParams()

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    // Use baseUrl if provided (for complex routing), otherwise just append params
    // If baseUrl is not provided, we rely on the current pathname via Link context usually,
    // but here we just return the query string if we are on the same page.
    // However, Link href needs a full path or simple ?query if it's the same page.
    // Let's assume we want to stay on the same path.
    return `?${params.toString()}`
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = []
    const delta = 2 // Number of pages to show on each side of current page

    // Always show first page
    pages.push(1)

    // Calculate range around current page
    let left = Math.max(2, currentPage - delta)
    let right = Math.min(totalPages - 1, currentPage + delta)

    // Adjust if range is too close to ends
    if (currentPage - delta <= 2) {
      right = Math.min(totalPages - 1, 1 + delta * 2)
    }
    if (currentPage + delta >= totalPages - 1) {
      left = Math.max(2, totalPages - delta * 2)
    }

    // Add ellipsis before range if needed
    if (left > 2) {
      pages.push('ellipsis-start')
    }

    // Add range
    for (let i = left; i <= right; i++) {
      pages.push(i)
    }

    // Add ellipsis after range if needed
    if (right < totalPages - 1) {
      pages.push('ellipsis-end')
    }

    // Always show last page if more than 1 page
    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="flex items-center justify-center space-x-2 my-8">
      {/* Previous Button */}
      <Button variant="outline" size="icon" disabled={currentPage <= 1} asChild={currentPage > 1}>
        {currentPage > 1 ? (
          <Link href={createPageUrl(currentPage - 1)} aria-label="Previous Page">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        ) : (
          <span>
            <ChevronLeft className="h-4 w-4" />
          </span>
        )}
      </Button>

      {/* Page Numbers */}
      <div className="flex items-center space-x-2">
        {getPageNumbers().map((page, index) => {
          if (typeof page === 'string') {
            return (
              <div key={`ellipsis-${index}`} className="flex items-center justify-center w-9 h-9">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </div>
            )
          }

          const isCurrent = page === currentPage

          return (
            <Button
              key={page}
              variant={isCurrent ? 'default' : 'outline'}
              size="icon"
              asChild
              className={cn(isCurrent && 'pointer-events-none')}
            >
              <Link href={createPageUrl(page)} aria-current={isCurrent ? 'page' : undefined}>
                {page}
              </Link>
            </Button>
          )
        })}
      </div>

      {/* Next Button */}
      <Button
        variant="outline"
        size="icon"
        disabled={currentPage >= totalPages}
        asChild={currentPage < totalPages}
      >
        {currentPage < totalPages ? (
          <Link href={createPageUrl(currentPage + 1)} aria-label="Next Page">
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span>
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </Button>
    </div>
  )
}
