'use client'

import React from 'react'
import { siteConfig, getFullUrl } from '@/lib/site-config'
import type { Topic } from '@/payload-types'
import type { MergedProduct } from './product-card'

interface TopicJsonLdProps {
  topic: Topic
  products: MergedProduct[]
}

/**
 * JSON-LD structured data for Topic page
 * Includes CollectionPage, BreadcrumbList, and ItemList schemas
 */
export function TopicJsonLd({ topic, products }: TopicJsonLdProps) {
  const topicUrl = getFullUrl(`/gear/${topic.slug}`)
  const topicName = topic.display_name || topic.name
  const hasBestPrefix = /^best\b/i.test(topicName)

  // CollectionPage schema
  const collectionPage = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${hasBestPrefix ? '' : 'Best '}${topicName}`,
    description:
      topic.meta_description ||
      `Discover the ${hasBestPrefix ? '' : 'best '}${topicName} on Amazon. Top ${products.length} recommended products with reviews and ratings.`,
    url: topicUrl,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: products.slice(0, 10).map((product, index) => {
        const paapi = product.product?.paapi5 as
          | {
              ItemInfo?: { Title?: { DisplayValue?: string } }
              Images?: { Primary?: { Medium?: { URL?: string } } }
            }
          | undefined
        const scraperMeta = product.scraper?.scraperMetadata as
          | { title?: string; image?: string }
          | undefined
        const title =
          paapi?.ItemInfo?.Title?.DisplayValue || scraperMeta?.title || `Product ${product.asin}`
        const image =
          paapi?.Images?.Primary?.Medium?.URL || product.product?.image || scraperMeta?.image

        return {
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Product',
            name: title,
            url: getFullUrl(`/p/${product.asin}`),
            ...(image && { image }),
          },
        }
      }),
    },
  }

  // BreadcrumbList schema
  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteConfig.url,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: topicName,
        item: topicUrl,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionPage) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbList) }}
      />
    </>
  )
}
