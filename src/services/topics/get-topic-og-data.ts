import { getPayloadClient } from '@/lib/payload'
import { sql } from '@payloadcms/db-postgres'

export interface TopicOgData {
  title: string
  subtitle: string
  productCount: number
  topBrands: string[]
  topImages: string[]
  updatedAt: string
}

export async function getTopicOgData(slug: string): Promise<TopicOgData | null> {
  const payload = await getPayloadClient()
  const db = payload.db.drizzle

  // 1. Fetch Topic Basic Info
  const topicResult = await db.execute(sql`
    SELECT 
      name, 
      display_name, 
      updated_at
    FROM "topics" 
    WHERE "slug" = ${slug} AND "active" = true 
    LIMIT 1
  `)

  if (topicResult.rows.length === 0) {
    return null
  }

  const topicRow = topicResult.rows[0]
  const name = topicRow.name as string
  const displayName = (topicRow.display_name as string) || name
  const updatedAt = new Date(topicRow.updated_at as string).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  // 2. Fetch Top Products for Brand Extraction (Top 50 by weighted score)
  // We only need product metadata to extract brands
  const productsResult = await db.execute(sql`
    SELECT 
      p.paapi5 as "paapi5",
      s.scraper_metadata as "scraperMetadata",
      ast.weighted_score
    FROM "aba_search_terms" ast
    INNER JOIN "products" p ON ast.asin = p.asin AND p.active = true
    LEFT JOIN "product_scrapers" s ON ast.asin = s.asin AND s.active = true
    WHERE ast.keywords = ${name}
    ORDER BY "weighted_score" DESC
    LIMIT 50
  `)

  // 3. Aggregate Brands and Count
  const brandCounts = new Map<string, number>()
  const images: string[] = []
  const rows = productsResult.rows

  for (const row of rows) {
    const paapi = (row.paapi5 || {}) as any
    const scraperMeta = (row.scraperMetadata || {}) as any

    // Extract Brand
    const brandName =
      paapi?.ItemInfo?.ByLineInfo?.Brand?.DisplayValue ||
      paapi?.ItemInfo?.ByLineInfo?.Manufacturer?.DisplayValue ||
      scraperMeta?.brand

    if (brandName) {
      // Normalize brand name slightly
      const normalized = brandName.trim()
      brandCounts.set(normalized, (brandCounts.get(normalized) || 0) + 1)
    }

    // Extract Image
    // Prioritize PAAPI High Res, then Scraper
    const image =
      paapi?.Images?.Primary?.Large?.URL ||
      paapi?.Images?.Primary?.Medium?.URL ||
      scraperMeta?.image ||
      scraperMeta?.images?.[0]

    if (image && typeof image === 'string' && image.startsWith('http')) {
      if (!images.includes(image)) {
        images.push(image)
      }
    }
  }

  // Sort brands by frequency
  const topBrands = Array.from(brandCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([brand]) => brand)
    .slice(0, 4) // Top 4 brands

  // Top 3 unique images
  const topImages = images.slice(0, 3)

  return {
    title: displayName,
    subtitle: `Top ${rows.length}+ Reviewed Products`, // Approximate "Analysed" count
    productCount: rows.length,
    topBrands,
    topImages,
    updatedAt,
  }
}
