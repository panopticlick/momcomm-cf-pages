'use client'

import React from 'react'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Building2, Package, TrendingUp, Award } from 'lucide-react'
import type { BrandRanking } from '@/services/brands/ranking'
import type { Brand } from '@/payload-types'

interface BrandHeaderProps {
  brand: Brand
  ranking: BrandRanking
  logoUrl?: string
}

export function BrandHeader({ brand, ranking, logoUrl }: BrandHeaderProps) {
  const getRankLabel = (rank: number) => {
    if (rank === 1) return { label: '🥇 #1 Top Brand', variant: 'default' as const }
    if (rank === 2) return { label: '🥈 #2 Brand', variant: 'secondary' as const }
    if (rank === 3) return { label: '🥉 #3 Brand', variant: 'secondary' as const }
    if (rank <= 10) return { label: `🏆 Top 10 #${rank}`, variant: 'outline' as const }
    return { label: `#${rank}`, variant: 'outline' as const }
  }

  const rankInfo = getRankLabel(ranking.rank)

  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
        {/* Brand Logo */}
        <div className="w-24 h-24 shrink-0 relative bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-lg flex items-center justify-center ring-1 ring-black/5 dark:ring-white/10">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={brand.name}
              fill
              className="object-contain p-3"
              sizes="96px"
              priority
            />
          ) : (
            <Building2 className="w-12 h-12 text-muted-foreground/50" />
          )}
        </div>

        {/* Brand Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">{brand.name}</h1>
            <Badge variant={rankInfo.variant} className="text-sm px-3 py-1">
              {rankInfo.label}
            </Badge>
          </div>

          {brand.description && (
            <p className="text-muted-foreground text-lg max-w-3xl">{brand.description}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-xl p-4 ring-1 ring-black/5 dark:ring-white/10">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Award className="w-4 h-4" />
            <span>Ranking</span>
          </div>
          <p className="text-2xl font-bold text-foreground">#{ranking.rank}</p>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-xl p-4 ring-1 ring-black/5 dark:ring-white/10">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Package className="w-4 h-4" />
            <span>Products</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {ranking.asin_count.toLocaleString()}
          </p>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-xl p-4 ring-1 ring-black/5 dark:ring-white/10">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Weighted Score</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {ranking.weighted_score_sum.toFixed(2)}
          </p>
        </div>

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-xl p-4 ring-1 ring-black/5 dark:ring-white/10">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Click Share</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {ranking.click_share_sum.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  )
}
