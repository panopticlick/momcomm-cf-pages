import { getPayloadClient } from '@/lib/payload'
import { sql } from '@payloadcms/db-postgres'
import type { Product, ProductScraper, Brand } from '@/payload-types'

export interface ProductTopic {
  id: number
  name: string
  slug: string
  display_name?: string | null
  weighted_score_sum?: number | null
}

export interface AlternativeProduct {
  asin: string
  title: string
  image: string | null
  brand?: {
    name: string
    slug: string
  } | null
  commonTopicCount: number
  score: number
}

export interface ProductAlternativesData {
  product: {
    asin: string
    title: string
    image: string | null
    brand?: {
      id: number
      name: string
      slug: string
    } | null
    paapi5: any
    scraperMetadata: any
  }
  topics: ProductTopic[]
  alternatives: AlternativeProduct[]
}

/**
 * 获取产品替代需求页面数据
 * 包含：产品基本信息、关联的需求（Topics）、替代产品
 * @param asin 产品 ASIN
 * @returns ProductAlternativesData | null
 */
export async function getProductAlternativesData(
  asin: string,
): Promise<ProductAlternativesData | null> {
  const payload = await getPayloadClient()
  const db = payload.db.drizzle

  // 1. 获取产品基本信息
  const productResult = await db.execute(sql`
    SELECT 
      p.asin,
      p.paapi5,
      p.image,
      b.id as brand_id,
      b.name as brand_name,
      b.slug as brand_slug,
      s.scraper_metadata
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN product_scrapers s ON p.asin = s.asin AND s.active = true
    WHERE p.asin = ${asin} AND p.active = true
    LIMIT 1
  `)

  if (productResult.rows.length === 0) {
    return null
  }

  const productRow = productResult.rows[0] as any
  const paapi = productRow.paapi5
  const scraperMetadata = productRow.scraper_metadata

  const title = paapi?.ItemInfo?.Title?.DisplayValue || scraperMetadata?.title || `Product ${asin}`

  const image =
    paapi?.Images?.Primary?.Large?.URL ||
    paapi?.Images?.Primary?.Medium?.URL ||
    productRow.image ||
    scraperMetadata?.image ||
    null

  const product = {
    asin,
    title,
    image,
    brand: productRow.brand_id
      ? {
          id: productRow.brand_id,
          name: productRow.brand_name,
          slug: productRow.brand_slug,
        }
      : null,
    paapi5: paapi,
    scraperMetadata,
  }

  // 2. 获取该产品关联的所有活跃 Topics（需求）
  const topicsResult = await db.execute(sql`
    SELECT DISTINCT
      t.id,
      t.name,
      t.slug,
      t.display_name,
      t.weighted_score_sum
    FROM aba_search_terms ast
    INNER JOIN topics t ON ast.keywords = t.name
    WHERE ast.asin = ${asin}
      AND t.active = true
    ORDER BY t.weighted_score_sum DESC NULLS LAST
    LIMIT 20
  `)

  const topics: ProductTopic[] = (topicsResult.rows as any[]).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    display_name: row.display_name,
    weighted_score_sum: row.weighted_score_sum,
  }))

  // 3. 获取替代产品
  // 逻辑：找到与当前产品共享最多 Topics 的其他产品
  const topicNames = topics.map((t) => t.name)

  let alternatives: AlternativeProduct[] = []

  if (topicNames.length > 0) {
    const alternativesResult = await db.execute(sql`
      WITH current_product_topics AS (
        SELECT DISTINCT keywords
        FROM aba_search_terms
        WHERE asin = ${asin}
      ),
      related_products AS (
        SELECT 
          ast.asin,
          COUNT(DISTINCT ast.keywords) as common_topic_count,
          MAX(ast.weighted_score) as max_score
        FROM aba_search_terms ast
        INNER JOIN current_product_topics cpt ON ast.keywords = cpt.keywords
        INNER JOIN topics t ON ast.keywords = t.name AND t.active = true
        WHERE ast.asin != ${asin}
        GROUP BY ast.asin
        HAVING COUNT(DISTINCT ast.keywords) >= 1
        ORDER BY common_topic_count DESC, max_score DESC
        LIMIT 6
      )
      SELECT 
        rp.asin,
        rp.common_topic_count,
        rp.max_score,
        p.paapi5,
        p.image,
        b.name as brand_name,
        b.slug as brand_slug,
        s.scraper_metadata
      FROM related_products rp
      INNER JOIN products p ON rp.asin = p.asin AND p.active = true
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN product_scrapers s ON rp.asin = s.asin AND s.active = true
      ORDER BY rp.common_topic_count DESC, rp.max_score DESC
    `)

    alternatives = (alternativesResult.rows as any[]).map((row) => {
      const altPaapi = row.paapi5
      const altScraperMeta = row.scraper_metadata

      const altTitle =
        altPaapi?.ItemInfo?.Title?.DisplayValue || altScraperMeta?.title || `Product ${row.asin}`

      const altImage =
        altPaapi?.Images?.Primary?.Large?.URL ||
        altPaapi?.Images?.Primary?.Medium?.URL ||
        row.image ||
        altScraperMeta?.image ||
        null

      return {
        asin: row.asin,
        title: altTitle,
        image: altImage,
        brand: row.brand_name
          ? {
              name: row.brand_name,
              slug: row.brand_slug,
            }
          : null,
        commonTopicCount: Number(row.common_topic_count),
        score: Number(row.max_score) || 0,
      }
    })
  }

  return {
    product,
    topics,
    alternatives,
  }
}
