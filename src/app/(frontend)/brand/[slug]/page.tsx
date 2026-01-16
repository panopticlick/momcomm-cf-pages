import React, { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayloadClient } from '@/lib/payload'
import { siteConfig, getFullUrl } from '@/lib/site-config'
import { getBrandRankBySlug } from '@/services/brands/ranking'
import { getProductTopics } from '@/services/products/get-product-topics'
import { getSimilarBrandsByTopics } from '@/services/brands/similarity'
import { SimilarBrands } from '@/components/frontend/brand/similar-brands'
import { BrandHeader } from '@/components/frontend/brand/brand-header'
import { ProductListItem } from '@/components/frontend/brand/product-list-item'
import { ProductSortSelect, type SortOption } from '@/components/frontend/brand/product-sort-select'
import { ChevronLeft, Package } from 'lucide-react'
import type { Media } from '@/payload-types'

export const dynamic = 'force-dynamic'

const validSortFields: SortOption[] = [
  'weighted_score_sum',
  'click_share_sum',
  'conversion_share_sum',
]

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayloadClient()

  const brandQuery = await payload.find({
    collection: 'brands',
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
  })

  if (brandQuery.docs.length === 0) {
    return {
      title: 'Brand Not Found',
    }
  }

  const brand = brandQuery.docs[0]
  const title = `${brand.name} - Brand Products and Reviews`
  const description =
    brand.description ||
    `Explore ${brand.name} products on Amazon. Find top-rated items, reviews, and the best deals.`

  return {
    title,
    description,
    alternates: {
      canonical: getFullUrl(`/brand/${slug}`),
    },
    openGraph: {
      title,
      description,
      url: getFullUrl(`/brand/${slug}`),
      siteName: siteConfig.name,
      type: 'website',
    },
  }
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sort?: string }>
}) {
  const { slug } = await params
  const { sort: sortParam } = await searchParams
  const payload = await getPayloadClient()

  // Validate sort parameter
  const sortField: SortOption = validSortFields.includes(sortParam as SortOption)
    ? (sortParam as SortOption)
    : 'weighted_score_sum'

  // Fetch brand details
  const brandQuery = await payload.find({
    collection: 'brands',
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
    depth: 1,
  })

  if (brandQuery.docs.length === 0) {
    return notFound()
  }

  const brand = brandQuery.docs[0]

  // Fetch brand ranking
  const ranking = await getBrandRankBySlug(slug)

  if (!ranking) {
    return notFound()
  }

  // Fetch brand products with dynamic sort
  const productsQuery = await payload.find({
    collection: 'products',
    where: {
      brand: {
        equals: brand.id,
      },
      active: {
        equals: true,
      },
    },
    limit: 20,
    sort: `-${sortField}`,
    depth: 1,
  })

  // 批量获取所有产品关联的活跃主题
  const productAsins = productsQuery.docs.map((p) => p.asin)
  const productTopicsMap = await getProductTopics(productAsins)

  // Fetch similar brands
  const similarBrands = await getSimilarBrandsByTopics(slug)

  // Get logo URL
  let logoUrl: string | undefined
  if (brand.logo && typeof brand.logo === 'object') {
    const media = brand.logo as Media
    logoUrl = media.url || undefined
  }

  const description =
    brand.description ||
    `Explore ${brand.name} products on Amazon. Find top-rated items, reviews, and the best deals.`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Brand',
    name: brand.name,
    description: description,
    url: getFullUrl(`/brand/${slug}`),
    logo: logoUrl,
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link
            href="/top-brands"
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Top Brands
          </Link>
        </nav>

        {/* Brand Header */}
        <BrandHeader brand={brand} ranking={ranking} logoUrl={logoUrl} />

        {/* Products Section */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Package className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold">Products by {brand.name}</h2>
            </div>
            <Suspense fallback={<div className="h-8 w-32 bg-muted animate-pulse rounded-lg" />}>
              <ProductSortSelect currentSort={sortField} />
            </Suspense>
          </div>

          {productsQuery.docs.length === 0 ? (
            <div className="text-center py-12 bg-white/30 dark:bg-slate-900/30 rounded-3xl border border-dashed border-muted-foreground/30">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground text-lg">No products found for this brand.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {productsQuery.docs.map((product) => {
                // Extract data from paapi5 JSON field
                const paapi = product.paapi5 as
                  | {
                      ItemInfo?: { Title?: { DisplayValue?: string } }
                      Images?: { Primary?: { Large?: { URL?: string }; Medium?: { URL?: string } } }
                    }
                  | undefined

                const title = paapi?.ItemInfo?.Title?.DisplayValue || `Product ${product.asin}`
                const imageUrl =
                  paapi?.Images?.Primary?.Large?.URL ||
                  paapi?.Images?.Primary?.Medium?.URL ||
                  product.image ||
                  undefined

                const topics = productTopicsMap.get(product.asin) || []

                return (
                  <ProductListItem
                    key={product.id}
                    asin={product.asin}
                    title={title}
                    imageUrl={imageUrl || undefined}
                    topics={topics}
                  />
                )
              })}
            </div>
          )}
        </section>

        {/* Similar Brands Section */}
        <SimilarBrands currentBrandName={brand.name} brands={similarBrands} />
      </div>
    </div>
  )
}
