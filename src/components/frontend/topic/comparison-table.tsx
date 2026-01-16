'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AffiliateDisclosure } from '@/components/ui/affiliate-disclosure'
import { Check, Minus, X, ChevronDown, ChevronUp } from 'lucide-react'
import type { MergedProduct } from './product-card'

interface ComparisonTableProps {
  products: MergedProduct[]
}

export function ComparisonTable({ products }: ComparisonTableProps) {
  const [isExpanded, setIsExpanded] = React.useState(false)

  if (!products || products.length === 0) return null

  // Helper to safely get overview data
  const getOverview = (product: MergedProduct) => {
    const meta = product.scraper?.scraperMetadata as
      | { overview?: Array<{ id: string; name: string; value: string }> }
      | undefined
    return (meta?.overview || []).filter((item) => item.value && !item.value.includes('function('))
  }

  // 1. Analysis: Collect all unique keys and count frequency
  const keyFrequency = new Map<string, number>() // key -> count
  const allKeysMap = new Map<string, string>() // key -> display name

  products.forEach((p) => {
    const overview = getOverview(p)
    const seenKeys = new Set<string>() // Ensure we count unique product occurrences, not duplicate keys in one product

    overview.forEach((item) => {
      if (item.name && item.value) {
        const key = item.name.trim()
        if (!seenKeys.has(key)) {
          seenKeys.add(key)
          keyFrequency.set(key, (keyFrequency.get(key) || 0) + 1)
          if (!allKeysMap.has(key)) {
            allKeysMap.set(key, item.name)
          }
        }
      }
    })
  })

  // 2. Filter: Only show "common" items (freq >= 3, or max available if filtered count is low?)
  // Requirement: "Least not lower than 3 data parameters" - interpreted as frequency >= 3
  // Also Requirement: "Default only show 5 items data" - interpreted as 5 rows
  const FREQUENCY_THRESHOLD = Math.min(3, products.length)

  const commonKeys = Array.from(allKeysMap.keys()).filter((key) => {
    return (keyFrequency.get(key) || 0) >= FREQUENCY_THRESHOLD
  })

  if (commonKeys.length === 0) return null

  // 3. Pagination: Default 5 items
  const displayKeys = isExpanded ? commonKeys : commonKeys.slice(0, 5)
  const hasMore = commonKeys.length > 5

  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs mb-8">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-bold text-slate-900">Compare Top Products</h3>
        <AffiliateDisclosure variant="compact" />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="p-4 text-left w-40 bg-slate-50 border-b border-slate-100 sticky left-0 z-10 font-medium text-slate-500">
                Product
              </th>
              {products.map((p, idx) => {
                const title =
                  (p.product?.paapi5 as any)?.ItemInfo?.Title?.DisplayValue ||
                  (p.scraper?.scraperMetadata as any)?.title ||
                  `Product ${idx + 1}`
                const image =
                  (p.product?.paapi5 as any)?.Images?.Primary?.Large?.URL ||
                  (p.product?.paapi5 as any)?.Images?.Primary?.Medium?.URL ||
                  p.product?.image ||
                  (p.scraper?.scraperMetadata as any)?.image

                return (
                  <th
                    key={p.asin}
                    className="p-4 w-60 align-top border-b border-slate-100 bg-white"
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="relative w-24 h-24 mb-1">
                        {image ? (
                          <Image
                            src={image}
                            alt={title}
                            fill
                            className="object-contain mix-blend-multiply"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                            No Img
                          </div>
                        )}
                      </div>
                      <Link
                        href={`/p/${p.asin}`}
                        className="line-clamp-2 text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                        title={title}
                      >
                        {title}
                      </Link>
                      {idx === 0 && (
                        <Badge
                          variant="default"
                          className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] h-5 px-2"
                        >
                          Best Overall
                        </Badge>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {displayKeys.map((key, rowIdx) => (
              <tr key={key} className={rowIdx % 2 === 0 ? 'bg-slate-50/30' : 'bg-white'}>
                <td className="p-4 font-medium text-slate-700 border-b border-slate-100 sticky left-0 bg-white/95 backdrop-blur-xs z-10 border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  {allKeysMap.get(key)}
                </td>
                {products.map((p) => {
                  const overview = getOverview(p)
                  const item = overview.find((o) => o.name.trim() === key)
                  const value = item ? item.value : '-'

                  return (
                    <td
                      key={p.asin}
                      className="p-4 text-center border-b border-slate-100 text-slate-600"
                    >
                      {renderValue(value)}
                    </td>
                  )
                })}
              </tr>
            ))}

            {/* Show More Row */}
            {hasMore && (
              <tr>
                <td colSpan={products.length + 1} className="p-0 border-b border-slate-100">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full py-3 text-sm text-blue-600 font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {isExpanded ? (
                      <>
                        Show Less <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Show All {commonKeys.length} Parameters <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </td>
              </tr>
            )}

            {/* Action Row */}
            <tr>
              <td className="p-4 border-t border-slate-100 bg-slate-50 sticky left-0 z-10"></td>
              {products.map((p) => (
                <td key={`action-${p.asin}`} className="p-4 border-t border-slate-100 text-center">
                  <a
                    href={`/go/${p.asin}`}
                    rel="nofollow"
                    target="_blank"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 w-full"
                  >
                    Check Price
                  </a>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden p-4 space-y-4">
        {products.map((p, idx) => {
          const title =
            (p.product?.paapi5 as any)?.ItemInfo?.Title?.DisplayValue ||
            (p.scraper?.scraperMetadata as any)?.title ||
            `Product ${idx + 1}`
          const image =
            (p.product?.paapi5 as any)?.Images?.Primary?.Large?.URL ||
            (p.product?.paapi5 as any)?.Images?.Primary?.Medium?.URL ||
            p.product?.image ||
            (p.scraper?.scraperMetadata as any)?.image
          const overview = getOverview(p)

          return (
            <div key={p.asin} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="flex gap-4 mb-4">
                <div className="relative w-20 h-20 shrink-0">
                  {image ? (
                    <Image
                      src={image}
                      alt={title}
                      fill
                      className="object-contain mix-blend-multiply"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs text-slate-400 rounded">
                      No Img
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/p/${p.asin}`}
                    className="font-semibold text-sm text-slate-900 hover:text-blue-600 line-clamp-2"
                  >
                    {title}
                  </Link>
                  {idx === 0 && (
                    <Badge className="mt-2 bg-amber-500 hover:bg-amber-600 text-white text-[10px] h-5 px-2">
                      Best Overall
                    </Badge>
                  )}
                </div>
              </div>

              {/* Mobile: Show only first 3 specs */}
              <div className="space-y-2 mb-4">
                {displayKeys.slice(0, 3).map((key) => {
                  const item = overview.find((o) => o.name.trim() === key)
                  const value = item ? item.value : '-'
                  return (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{allKeysMap.get(key)}:</span>
                      <span className="font-medium text-slate-700 ml-2">{renderValue(value)}</span>
                    </div>
                  )
                })}
              </div>

              <a
                href={`/go/${p.asin}`}
                rel="nofollow"
                target="_blank"
                className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
              >
                Check Price
              </a>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function renderValue(value: string) {
  const lower = value.toLowerCase().trim()
  if (lower === 'yes' || lower === 'true') {
    return <Check className="w-5 h-5 text-green-500 mx-auto" />
  }
  if (lower === 'no' || lower === 'false') {
    return <X className="w-5 h-5 text-red-500 mx-auto" />
  }
  if (value === '-') {
    return <Minus className="w-4 h-4 text-slate-300 mx-auto" />
  }
  return <span className="text-sm">{value}</span>
}
