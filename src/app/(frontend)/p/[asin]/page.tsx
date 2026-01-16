import React from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ChevronLeft } from 'lucide-react'
import { siteConfig, getFullUrl } from '@/lib/site-config'
import { getProductAlternativesData } from '@/services/products/get-product-alternatives'
import {
  ProductHero,
  RelatedTopics,
  AlternativeProducts,
  ProductAlternativeJsonLd,
} from '@/components/frontend/product-alternative'

// Product pages use ISR with 1-hour revalidation
export const revalidate = 3600

/**
 * Generate metadata for Product Alternative page (SEO)
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ asin: string }>
}): Promise<Metadata> {
  const { asin } = await params
  const data = await getProductAlternativesData(asin)

  if (!data) {
    return {
      title: 'Product Not Found',
      robots: { index: false, follow: false },
    }
  }

  const { product, topics } = data
  const topicNames = topics.slice(0, 3).map((t) => t.display_name || t.name)
  const brandName = product.brand?.name ? `${product.brand.name} ` : ''

  const title = `Best Alternatives to ${brandName}${product.title} - Top Rated Replacements`

  let description = `Looking for a better choice than ${product.title}? `
  if (topicNames.length > 0) {
    description += `Discover top-rated alternatives for ${topicNames.join(', ')}. `
  }
  description += `Compute alternatives based on real user shopping needs and find the perfect match for you.`

  return {
    title,
    description,
    alternates: {
      canonical: getFullUrl(`/p/${asin}`),
    },
    openGraph: {
      title,
      description,
      url: getFullUrl(`/p/${asin}`),
      siteName: siteConfig.name,
      type: 'website',
      images: product.image
        ? [
            {
              url: product.image,
              width: 500,
              height: 500,
              alt: product.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function ProductAlternativePage({
  params,
}: {
  params: Promise<{ asin: string }>
}) {
  const { asin } = await params

  const data = await getProductAlternativesData(asin)

  if (!data) {
    return notFound()
  }

  const { product, topics, alternatives } = data

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      <ProductAlternativeJsonLd data={data} />

      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </nav>

        {/* Product Hero Section */}
        <ProductHero
          asin={product.asin}
          title={product.title}
          image={product.image}
          brand={product.brand}
          paapi5={product.paapi5}
          scraperMetadata={product.scraperMetadata}
        />

        {/* Related Topics (Needs) Section */}
        <RelatedTopics topics={topics} />

        {/* Alternative Products Section */}
        <AlternativeProducts products={alternatives} currentProductTitle={product.title} />
      </div>
    </div>
  )
}
