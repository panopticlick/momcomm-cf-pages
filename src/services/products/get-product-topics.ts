import { getPayloadClient } from '@/lib/payload'
import { sql } from '@payloadcms/db-postgres'

export interface ProductTopic {
  id: number
  name: string
  slug: string
  display_name?: string | null
}

/**
 * 批量获取多个产品关联的活跃主题
 * 通过 aba_search_terms.asin 与 topics.name = aba_search_terms.keywords 进行联查
 * @param asins 产品 ASIN 列表
 * @returns Map<asin, ProductTopic[]>
 */
export async function getProductTopics(asins: string[]): Promise<Map<string, ProductTopic[]>> {
  if (asins.length === 0) {
    return new Map()
  }

  const payload = await getPayloadClient()
  const db = payload.db.drizzle

  // 使用 SQL IN 查询批量获取
  const asinList = asins.map((a) => `'${a.replace(/'/g, "''")}'`).join(',')

  const result = await db.execute(
    sql.raw(`
    SELECT DISTINCT
      ast.asin,
      t.id,
      t.name,
      t.slug,
      t.display_name,
      t.weighted_score_sum
    FROM "aba_search_terms" ast
    INNER JOIN "topics" t ON ast.keywords = t.name
    WHERE ast.asin IN (${asinList})
      AND t.active = true
    ORDER BY ast.asin, t.weighted_score_sum DESC NULLS LAST
  `),
  )

  // 构建 Map<asin, Topic[]>
  const topicsMap = new Map<string, ProductTopic[]>()

  for (const row of result.rows as any[]) {
    const asin = row.asin as string
    const topic: ProductTopic = {
      id: row.id,
      name: row.name,
      slug: row.slug,
      display_name: row.display_name,
    }

    if (!topicsMap.has(asin)) {
      topicsMap.set(asin, [])
    }
    topicsMap.get(asin)!.push(topic)
  }

  return topicsMap
}
