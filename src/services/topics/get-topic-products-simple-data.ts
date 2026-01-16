import { getPayloadClient } from '@/lib/payload'
import { sql } from '@payloadcms/db-postgres'

export interface CompressedProductData {
  // From PAAPI5
  title?: string
  price?: string
  brand?: string

  // From Scraper Metadata
  overview?: string
  average_reviews?: number | string
  best_seller_badge?: boolean | string
  amazon_choice_badge?: boolean | string
  zeitgeist_badge?: boolean | string
}

export interface TopicProductItem {
  asin: string
  weighted_score?: number
  keywords: string
  click_share?: number
  conversion_share?: number
  occurrences?: number
  data: CompressedProductData
}

export interface TopicProductsSimpleResponse {
  id: number
  name: string
  products: TopicProductItem[]
}

function compressProductData(paapi5: any, scraperMetadata: any): CompressedProductData {
  const p = paapi5 || {}
  const s = scraperMetadata || {}

  // PAAPI5 Extraction
  // Robust check for standard PAAPI5 structure
  const title = p.ItemInfo?.Title?.DisplayValue || p.Title || null

  // Extract Price from PAAPI5 Offers
  // Usually in Offers.Listings[0].Price.DisplayAmount or Offers.Summaries[0].LowestPrice.DisplayAmount
  const price =
    p.Offers?.Listings?.[0]?.Price?.DisplayAmount ||
    p.Offers?.Summaries?.[0]?.LowestPrice?.DisplayAmount ||
    null

  // Extract Brand from PAAPI5
  const brand = p.ItemInfo?.ByLineInfo?.Brand?.DisplayValue || null

  // Scraper Metadata Extraction
  const overview = s.overview || null
  const average_reviews = s.average_reviews || null
  const best_seller_badge = s.best_seller_badge || null
  const amazon_choice_badge = s.amazon_choice_badge || null
  const zeitgeist_badge = s.zeitgeist_badge || null

  const data: CompressedProductData = {
    title,
    price,
    brand,
    overview,
    average_reviews,
    best_seller_badge,
    amazon_choice_badge,
    zeitgeist_badge,
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
export async function getTopicProductsSimpleData(
  id: number,
): Promise<TopicProductsSimpleResponse | null> {
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
        ast.keywords,
        ast.click_share,
        ast.conversion_share,
        
        -- Product & Scraper Fields
        p.paapi5 as "paapi5", 
        s.scraper_metadata as "scraperMetadata"
      FROM "aba_search_terms" ast
      JOIN current_topic ct ON ast.keywords = ct.name
      INNER JOIN "products" p ON ast.asin = p.asin AND p.active = true
      LEFT JOIN "product_scrapers" s ON ast.asin = s.asin AND s.active = true
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
        keywords: row.keywords,
        click_share: Math.round(row.click_share * 100) / 100,
        conversion_share: Math.round(row.conversion_share * 100) / 100,
        data: compressProductData(row.paapi5, row.scraperMetadata),
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
