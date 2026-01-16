'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'
import type { MergedProduct } from './product-card'

interface BrandStat {
  name: string
  score: number // total conversion share
  percentage: number // relative to max score (0-100)
  productCount?: number
  slug: string
}

interface TopicSidebarProps {
  topProducts: MergedProduct[]
  topBrands?: BrandStat[]
  dateRange?: string
}

export function TopicSidebar({ topProducts, topBrands = [], dateRange }: TopicSidebarProps) {
  const [showAllProducts, setShowAllProducts] = React.useState(false)

  const displayCount = Math.min(topProducts.length, 10)

  return (
    <div className="space-y-8">
      {/* Top Brands Section */}
      {topBrands.length > 0 && (
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Top Brands by Conversion Share</h3>
            {dateRange && <p className="text-xs text-muted-foreground mt-1">{dateRange}</p>}
            <div className="border-b mt-2" />
          </CardHeader>
          <CardContent className="px-0">
            <ul className="space-y-4">
              {topBrands.slice(0, 10).map((brand) => {
                return (
                  <li key={brand.name} className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm">
                      {brand.slug ? (
                        <Link
                          href={`/brand/${brand.slug}`}
                          className="font-semibold text-slate-800 truncate pr-2 hover:text-blue-600 hover:underline"
                          title={brand.name}
                        >
                          {brand.name}
                        </Link>
                      ) : (
                        <span
                          className="font-semibold text-slate-800 truncate pr-2"
                          title={brand.name}
                        >
                          {brand.name}
                        </span>
                      )}
                      {brand.productCount && (
                        <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">
                          {brand.productCount} listings
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Share: {brand.score.toFixed(1)}%</span>
                    </div>
                    <div
                      className="h-2 w-full bg-slate-100 rounded-full overflow-hidden"
                      title={`Relative Share Score: ${brand.percentage}%`}
                    >
                      <div
                        className="h-full bg-blue-600/80 rounded-full"
                        style={{ width: `${brand.percentage}%` }}
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          </CardContent>
          <div className="px-0 pt-2 pb-0">
            <p className="text-[10px] text-muted-foreground leading-tight">
              Amazon Brand Analytics data sourced from{' '}
              <a
                href="https://sell.amazon.com/tools/amazon-brand-analytics"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-slate-500"
              >
                Amazon Brand Analytics
              </a>
            </p>
          </div>
        </Card>
      )}

      {/* Top Products Section */}
      {topProducts.length > 0 && (
        <Card className="border-none shadow-none bg-transparent">
          <CardHeader className="px-0 pt-0 pb-4">
            <h3 className="text-lg font-bold text-slate-900 border-b pb-2">
              Top {displayCount} Picks
            </h3>
          </CardHeader>
          <CardContent className="px-0">
            <div className="space-y-4">
              {/* Only consider the top 10 products max */}
              {topProducts.slice(0, 10).map((item, index) => {
                // Logic for show more/less within the top 10
                if (!showAllProducts && index >= 5) return null

                const product = item.product
                const scraper = item.scraper
                const paapi = product?.paapi5 as
                  | {
                      ItemInfo?: { Title?: { DisplayValue?: string } }
                    }
                  | undefined
                const scraperMeta = scraper?.scraperMetadata as { title?: string } | undefined
                const title =
                  paapi?.ItemInfo?.Title?.DisplayValue ||
                  scraperMeta?.title ||
                  `Product ${item.asin}`

                return (
                  <div key={item.asin} className="group relative flex gap-3 items-start">
                    {/* Rank Number */}
                    <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-xs font-bold text-slate-600 group-hover:bg-primary group-hover:text-white transition-colors mt-0.5">
                      {index + 1}
                    </div>

                    {/* Title Link */}
                    <Link
                      href={`#top-${index + 1}`}
                      className="text-sm text-slate-600 font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2"
                      title={title}
                    >
                      {title}
                    </Link>
                  </div>
                )
              })}
            </div>

            {/* Show More Button (only if we have more than 5 items in the top 10) */}
            {topProducts.length > 5 && (
              <button
                onClick={() => setShowAllProducts(!showAllProducts)}
                className="text-sm text-blue-600 font-semibold hover:underline flex items-center gap-1 mt-4 ml-9"
              >
                {showAllProducts ? 'Show Less' : `View Top ${displayCount}`}
                <ArrowRight
                  className={`w-3 h-3 transition-transform ${showAllProducts ? 'rotate-180' : ''}`}
                />
              </button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
