'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Package, ArrowRight, TrendingUp } from 'lucide-react'
import type { BrandRanking } from '@/services/brands/ranking'

interface BrandCardProps {
  brand: BrandRanking
  logoUrl?: string
}

export function BrandCard({ brand, logoUrl }: BrandCardProps) {
  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-amber-500 text-white'
    if (rank === 2) return 'bg-gray-400 text-white'
    if (rank === 3) return 'bg-amber-700 text-white'
    if (rank <= 10) return 'bg-blue-500 text-white'
    return 'bg-muted text-muted-foreground'
  }

  return (
    <Link href={`/brand/${brand.slug}`} className="block group">
      <Card className="flex items-center gap-4 p-5 border-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ring-1 ring-black/5 dark:ring-white/10 group-hover:ring-primary/50 overflow-hidden relative">
        {/* Rank Badge */}
        <div
          className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getRankBadgeColor(brand.rank)}`}
        >
          #{brand.rank}
        </div>

        {/* Brand Logo */}
        <div className="w-16 h-16 shrink-0 relative bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={brand.name}
              fill
              className="object-contain p-2 group-hover:scale-110 transition-transform duration-500"
              sizes="64px"
            />
          ) : (
            <Building2 className="w-8 h-8 text-muted-foreground/50" />
          )}
        </div>

        {/* Brand Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {brand.name}
          </h3>
          <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              {brand.asin_count.toLocaleString()} products
            </span>
            {brand.weighted_score_sum > 0 && (
              <span className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-green-600 dark:text-green-400">
                  {brand.weighted_score_sum.toFixed(2)}
                </span>
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div className="shrink-0 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-primary">
          <ArrowRight className="w-5 h-5" />
        </div>
      </Card>
    </Link>
  )
}

interface BrandCardListProps {
  brands: BrandRanking[]
  logoMap?: Record<number, string>
}

export function BrandCardList({ brands, logoMap = {} }: BrandCardListProps) {
  if (brands.length === 0) {
    return (
      <div className="text-center py-12 bg-white/30 dark:bg-slate-900/30 rounded-3xl border border-dashed border-muted-foreground/30 backdrop-blur-sm">
        <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
        <p className="text-muted-foreground text-lg">No brands found.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {brands.map((brand) => (
        <BrandCard key={brand.id} brand={brand} logoUrl={logoMap[brand.id]} />
      ))}
    </div>
  )
}
