import React from 'react'
import type { Metadata } from 'next'
import { getPayloadClient } from '@/lib/payload'
import { siteConfig, getFullUrl } from '@/lib/site-config'
import { getBrandRankings } from '@/services/brands/ranking'
import { BrandCardList } from '@/components/frontend/brand/brand-card'
import { Pagination } from '@/components/frontend/pagination'
import { Award, Search } from 'lucide-react'
import type { Media } from '@/payload-types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Top Brands for Modern Families',
  description:
    'Discover the most trusted brands powering MomComm gear, tools, and family systems. Compare performance, product depth, and engagement.',
  alternates: {
    canonical: getFullUrl('/top-brands'),
  },
  openGraph: {
    title: 'Top Brands for Modern Families',
    description:
      'Discover the most trusted brands powering MomComm gear, tools, and family systems.',
    url: getFullUrl('/top-brands'),
    siteName: siteConfig.name,
    type: 'website',
  },
}

export default async function TopBrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const page = typeof params.page === 'string' ? parseInt(params.page, 10) : 1
  const search = typeof params.q === 'string' ? params.q : undefined

  const limit = 20
  const result = await getBrandRankings({ page, limit, search })

  // Fetch brand logos
  const payload = await getPayloadClient()
  const brandIds = result.brands.map((b) => b.id)

  let logoMap: Record<number, string> = {}

  if (brandIds.length > 0) {
    const brandsWithLogos = await payload.find({
      collection: 'brands',
      where: {
        id: {
          in: brandIds,
        },
      },
      limit: brandIds.length,
    })

    logoMap = brandsWithLogos.docs.reduce(
      (acc, brand) => {
        if (brand.logo && typeof brand.logo === 'object') {
          const media = brand.logo as Media
          if (media.url) {
            acc[brand.id] = media.url
          }
        }
        return acc
      },
      {} as Record<number, string>,
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Top Brands</h1>
              <p className="text-muted-foreground text-lg">
                {result.totalCount.toLocaleString()} brands ranked by performance
              </p>
            </div>
          </div>

          {/* Search Form */}
          <form action="/top-brands" method="GET" className="mt-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                name="q"
                placeholder="Search brands..."
                defaultValue={search}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </form>

          {search && (
            <p className="mt-4 text-muted-foreground">Showing results for &quot;{search}&quot;</p>
          )}
        </div>

        {/* Brand List */}
        <BrandCardList brands={result.brands} logoMap={logoMap} />

        {/* Pagination */}
        <Pagination currentPage={result.page} totalPages={result.totalPages} />
      </div>
    </div>
  )
}
