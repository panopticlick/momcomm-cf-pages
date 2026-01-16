import { getPayload } from 'payload'
import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import type { Brand } from '@/payload-types'
import { getBrandRankingsByIds } from './ranking'

export interface SimilarBrand extends Brand {
  commonTopicCount: number
  rank?: number
}

/**
 * Through BrandTopic model, query similar brands
 * Ranking by common Topic quantity
 * Get 6 similar
 */
export async function getSimilarBrandsByTopics(
  slug: string,
  limit: number = 6,
): Promise<SimilarBrand[]> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  // 1. Get the target brand ID
  const brandResult = await db.execute(sql`
    SELECT id FROM brands WHERE slug = ${slug} LIMIT 1
  `)

  if (brandResult.rows.length === 0) {
    return []
  }

  const brandId = brandResult.rows[0].id

  // 2. Find similar brands counting common topics
  const similarityResult = await db.execute(sql`
    WITH target_topics AS (
      SELECT topic_id
      FROM brand_topics
      WHERE brand_id = ${brandId}
    ),
    similar_brands_stats AS (
      SELECT
        bt.brand_id,
        COUNT(bt.topic_id) as common_count
      FROM brand_topics bt
      JOIN target_topics tt ON bt.topic_id = tt.topic_id
      WHERE bt.brand_id != ${brandId}
      GROUP BY bt.brand_id
    )
    SELECT
      brand_id,
      common_count
    FROM similar_brands_stats
    ORDER BY common_count DESC
    LIMIT ${limit}
  `)

  if (similarityResult.rows.length === 0) {
    return []
  }

  const similarStats = similarityResult.rows.map((row) => ({
    id: Number(row.brand_id),
    count: Number(row.common_count),
  }))

  const similarBrandIds = similarStats.map((s) => s.id)

  // 3. Fetch brand details
  const brandsResult = await payload.find({
    collection: 'brands',
    where: {
      id: {
        in: similarBrandIds,
      },
    },
    limit: limit,
  })

  // 4. Fetch brand rankings
  const rankings = await getBrandRankingsByIds(similarBrandIds)
  const rankingMap = new Map(rankings.map((r) => [r.id, r.rank]))

  // 5. Merge results and sort (because 'in' query doesn't guarantee order)
  const brandsMap = new Map(brandsResult.docs.map((brand) => [brand.id, brand]))

  const result: SimilarBrand[] = similarStats
    .map((stat): SimilarBrand | null => {
      const brand = brandsMap.get(stat.id)
      if (!brand) return null
      return {
        ...brand,
        commonTopicCount: stat.count,
        rank: rankingMap.get(stat.id),
      }
    })
    .filter((b): b is SimilarBrand => b !== null)

  return result
}
