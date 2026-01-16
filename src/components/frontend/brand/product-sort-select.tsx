'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowUpDown } from 'lucide-react'

const sortOptions = [
  { value: 'weighted_score_sum', label: 'Relevance' },
  { value: 'click_share_sum', label: 'Clicks' },
  { value: 'conversion_share_sum', label: 'Conversions' },
] as const

export type SortOption = (typeof sortOptions)[number]['value']

interface ProductSortSelectProps {
  currentSort?: string
}

export function ProductSortSelect({ currentSort = 'weighted_score_sum' }: ProductSortSelectProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', value)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Sort by:</span>
      <select
        value={currentSort}
        onChange={(e) => handleSortChange(e.target.value)}
        className="text-sm border border-border rounded-lg px-3 py-1.5 bg-background hover:bg-muted/50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
