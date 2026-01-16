import { getPayloadClient } from '@/lib/payload'
import { sql } from '@payloadcms/db-postgres'

export interface CompressedProductData {
  // From PAAPI5
  title?: string
  features: string[]
  price?: string
  brand?: string
  brandSlug?: string // For internal brand page linking

  // From Scraper Metadata
  overview?: any // Only included if product_information is not available
  top_brand?: any
  average_reviews?: number | string
  best_seller_badge?: boolean | string
  amazon_choice_badge?: boolean | string
  zeitgeist_badge?: boolean | string
  product_information?: any // Preferred over overview
}

export interface TopicProductItem {
  asin: string
  weighted_score?: number
  click_share?: number
  conversion_share?: number
  occurrences?: number
  data: CompressedProductData
}

export interface TopicProductsResponse {
  id: number
  name: string
  products: TopicProductItem[]
}

function compressProductData(
  paapi5: any,
  scraperMetadata: any,
  brandSlug?: string,
): CompressedProductData {
  const p = paapi5 || {}
  const s = scraperMetadata || {}

  // PAAPI5 Extraction
  const title = p.ItemInfo?.Title?.DisplayValue || p.Title || null
  const features = p.ItemInfo?.Features?.DisplayValues || p.Features || []

  // Extract Price from PAAPI5 Offers
  const price =
    p.Offers?.Listings?.[0]?.Price?.DisplayAmount ||
    p.Offers?.Summaries?.[0]?.LowestPrice?.DisplayAmount ||
    null

  // Extract brand from byline_info (simplified)
  const bylineInfo = p.ItemInfo?.ByLineInfo || null
  const brand = bylineInfo?.Brand?.DisplayValue || bylineInfo?.Manufacturer?.DisplayValue || null

  // Scraper Metadata Extraction
  const average_reviews = s.average_reviews || null
  const best_seller_badge = s.best_seller_badge || null
  const amazon_choice_badge = s.amazon_choice_badge || null
  const zeitgeist_badge = s.zeitgeist_badge || null
  const top_brand = s.top_brand || null

  // Prefer product_information over overview (only include one)
  // Filter out Customer Reviews and Best Sellers Rank from product_information
  let product_information = s.product_information || s.product_details || null
  if (product_information) {
    // If it's an object with details array (product_information structure)
    if (product_information.details && Array.isArray(product_information.details)) {
      product_information = {
        ...product_information,
        details: product_information.details.filter(
          (spec: any) =>
            spec?.name &&
            !spec.name.includes('Customer Reviews') &&
            !spec.name.includes('Best Sellers Rank'),
        ),
      }
    }
    // If it's a direct array (product_details structure)
    else if (Array.isArray(product_information)) {
      product_information = product_information.filter(
        (spec: any) =>
          spec?.name &&
          !spec.name.includes('Customer Reviews') &&
          !spec.name.includes('Best Sellers Rank'),
      )
    }
  }
  const overview = product_information ? null : s.overview || null

  const data: CompressedProductData = {
    title,
    features,
    price,
    brand,
    brandSlug: brandSlug || undefined,
    average_reviews,
    best_seller_badge,
    amazon_choice_badge,
    zeitgeist_badge,
    top_brand,
    product_information,
    overview,
  }

  // Remove null or undefined fields to reduce token usage
  Object.keys(data).forEach((key) => {
    const k = key as keyof CompressedProductData
    if (data[k] === null || data[k] === undefined || data[k] === '') {
      delete data[k]
    }
  })

  return data
}

// For LLM, AI Blocks
export async function getTopicProductsData(id: number): Promise<TopicProductsResponse | null> {
  const payload = await getPayloadClient()

  // Using raw SQL for efficiency
  const db = payload.db.drizzle

  const result = await db.execute(sql`
    WITH current_topic AS (
      SELECT * FROM "topics" WHERE id = ${id}
      LIMIT 1
    )
    SELECT 
        -- Topic Fields (aliased to avoid collision)
        ct.id as topic_id,
        ct.name as topic_name,

        -- Search Term Fields
        ast.asin,
        ast.weighted_score,
        ast.keywords,
        ast.click_share,
        ast.conversion_share,
        ast.start_date,
        ast.end_date,
        ast.occurrences,
        
        -- Product & Scraper Fields
        p.paapi5 as "paapi5", 
        s.scraper_metadata as "scraperMetadata",
        
        -- Brand Fields
        b.slug as "brandSlug"
      FROM "aba_search_terms" ast
      JOIN current_topic ct ON ast.keywords = ct.name
      INNER JOIN "products" p ON ast.asin = p.asin AND p.active = true
      LEFT JOIN "product_scrapers" s ON ast.asin = s.asin AND s.active = true
      LEFT JOIN "brands" b ON p.brand_id = b.id
      ORDER BY "conversion_share" DESC
      LIMIT 100
  `)

  if (result.rows.length === 0) {
    return null
  }

  const firstRow = result.rows[0]

  return {
    id: firstRow.topic_id as number,
    name: firstRow.topic_name as string,
    products: result.rows.map((row: any) => {
      const product: TopicProductItem = {
        asin: row.asin,
        weighted_score: Math.round(row.weighted_score * 10000) / 10000,
        click_share: Math.round(row.click_share * 100) / 100,
        conversion_share: Math.round(row.conversion_share * 100) / 100,
        occurrences: row.occurrences,
        data: compressProductData(row.paapi5, row.scraperMetadata, row.brandSlug),
      }

      // Remove null or undefined fields
      Object.keys(product).forEach((key) => {
        const k = key as keyof TopicProductItem
        if (product[k] === null || product[k] === undefined) {
          delete product[k]
        }
      })

      return product
    }),
  }
}
