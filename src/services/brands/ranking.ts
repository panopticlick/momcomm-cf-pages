import { getPayload } from 'payload'
import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'

export interface BrandRanking {
  rank: number
  id: number
  name: string
  slug: string
  asin_count: number
  click_share_sum: number
  conversion_share_sum: number
  weighted_score_sum: number
}

export interface GetBrandRankingsOptions {
  /** 按品牌名模糊搜索 */
  search?: string
  /** 每页数量，默认 20 */
  limit?: number
  /** 页码，从 1 开始，默认 1 */
  page?: number
}

export interface GetBrandRankingsResult {
  brands: BrandRanking[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
}

/**
 * 获取品牌排名列表
 * 按 weighted_score_sum 降序排序
 */
export async function getBrandRankings(
  options: GetBrandRankingsOptions = {},
): Promise<GetBrandRankingsResult> {
  const { search, limit = 20, page = 1 } = options

  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  const offset = (page - 1) * limit

  // 查询总数
  // 限制只统计前 1000 名内的品牌
  const countResult = search
    ? await db.execute(sql`
        WITH top_brands AS (
          SELECT name 
          FROM brands 
          ORDER BY weighted_score_sum DESC, name ASC 
          LIMIT 1000
        )
        SELECT COUNT(*) as total 
        FROM top_brands 
        WHERE LOWER(name) LIKE LOWER(${'%' + search + '%'})
      `)
    : await db.execute(sql`
        SELECT COUNT(*) as total 
        FROM (
          SELECT 1 
          FROM brands 
          ORDER BY weighted_score_sum DESC, name ASC 
          LIMIT 1000
        ) as sub
      `)
  const totalCount = Number((countResult.rows[0] as { total: string })?.total || 0)

  // 查询排名数据
  // 先取前 1000 名，再计算排名和分页
  const result = search
    ? await db.execute(sql`
        WITH top_brands AS (
          SELECT 
            id,
            name,
            slug,
            asin_count,
            click_share_sum,
            conversion_share_sum,
            weighted_score_sum
          FROM brands
          ORDER BY weighted_score_sum DESC, name ASC
          LIMIT 1000
        ),
        ranked_brands AS (
          SELECT 
            *,
            ROW_NUMBER() OVER (ORDER BY weighted_score_sum DESC, name ASC) as rank
          FROM top_brands
        )
        SELECT 
          rank,
          id,
          name,
          slug,
          asin_count,
          click_share_sum,
          conversion_share_sum,
          weighted_score_sum
        FROM ranked_brands
        WHERE LOWER(name) LIKE LOWER(${'%' + search + '%'})
        ORDER BY rank ASC
        LIMIT ${limit} OFFSET ${offset}
      `)
    : await db.execute(sql`
        WITH top_brands AS (
          SELECT 
            id,
            name,
            slug,
            asin_count,
            click_share_sum,
            conversion_share_sum,
            weighted_score_sum
          FROM brands
          ORDER BY weighted_score_sum DESC, name ASC
          LIMIT 1000
        ),
        ranked_brands AS (
          SELECT 
            *,
            ROW_NUMBER() OVER (ORDER BY weighted_score_sum DESC, name ASC) as rank
          FROM top_brands
        )
        SELECT 
          rank,
          id,
          name,
          slug,
          asin_count,
          click_share_sum,
          conversion_share_sum,
          weighted_score_sum
        FROM ranked_brands
        ORDER BY rank ASC
        LIMIT ${limit} OFFSET ${offset}
      `)

  const brands: BrandRanking[] = (result.rows as Record<string, unknown>[]).map((row) => ({
    rank: Number(row.rank),
    id: Number(row.id),
    name: String(row.name),
    slug: String(row.slug),
    asin_count: Number(row.asin_count || 0),
    click_share_sum: Number(row.click_share_sum || 0),
    conversion_share_sum: Number(row.conversion_share_sum || 0),
    weighted_score_sum: Number(row.weighted_score_sum || 0),
  }))

  return {
    brands,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
  }
}

/**
 * 根据品牌 slug 获取单个品牌的排名信息
 */
export async function getBrandRankBySlug(slug: string): Promise<BrandRanking | null> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  const result = await db.execute(sql`
    WITH ranked_brands AS (
      SELECT 
        id,
        name,
        slug,
        asin_count,
        click_share_sum,
        conversion_share_sum,
        weighted_score_sum,
        ROW_NUMBER() OVER (ORDER BY weighted_score_sum DESC, name ASC) as rank
      FROM brands
    )
    SELECT 
      rank,
      id,
      name,
      slug,
      asin_count,
      click_share_sum,
      conversion_share_sum,
      weighted_score_sum
    FROM ranked_brands
    WHERE slug = ${slug}
  `)

  if (result.rows.length === 0) {
    return null
  }

  const row = result.rows[0] as Record<string, unknown>
  return {
    rank: Number(row.rank),
    id: Number(row.id),
    name: String(row.name),
    slug: String(row.slug),
    asin_count: Number(row.asin_count || 0),
    click_share_sum: Number(row.click_share_sum || 0),
    conversion_share_sum: Number(row.conversion_share_sum || 0),
    weighted_score_sum: Number(row.weighted_score_sum || 0),
  }
}

/**
 * 根据品牌名精确匹配获取单个品牌的排名信息
 */
export async function getBrandRankByName(name: string): Promise<BrandRanking | null> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  const result = await db.execute(sql`
    WITH ranked_brands AS (
      SELECT 
        id,
        name,
        slug,
        asin_count,
        click_share_sum,
        conversion_share_sum,
        weighted_score_sum,
        ROW_NUMBER() OVER (ORDER BY weighted_score_sum DESC, name ASC) as rank
      FROM brands
    )
    SELECT 
      rank,
      id,
      name,
      slug,
      asin_count,
      click_share_sum,
      conversion_share_sum,
      weighted_score_sum
    FROM ranked_brands
    WHERE LOWER(name) = LOWER(${name})
  `)

  if (result.rows.length === 0) {
    return null
  }

  const row = result.rows[0] as Record<string, unknown>
  return {
    rank: Number(row.rank),
    id: Number(row.id),
    name: String(row.name),
    slug: String(row.slug),
    asin_count: Number(row.asin_count || 0),
    click_share_sum: Number(row.click_share_sum || 0),
    conversion_share_sum: Number(row.conversion_share_sum || 0),
    weighted_score_sum: Number(row.weighted_score_sum || 0),
  }
}

/**
 * 根据多个品牌 ID 批量获取排名信息
 */
export async function getBrandRankingsByIds(ids: number[]): Promise<BrandRanking[]> {
  if (ids.length === 0) {
    return []
  }

  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  // 使用 ANY 语法处理数组查询，确保 id 在传入的 ids 数组中
  // 注意：这里假设 ids 是数字数组，PostgreSQL 数组字面量格式为 {1,2,3}
  // 或者让 drizzle 处理参数化
  const result = await db.execute(sql`
    WITH ranked_brands AS (
      SELECT 
        id,
        name,
        slug,
        asin_count,
        click_share_sum,
        conversion_share_sum,
        weighted_score_sum,
        ROW_NUMBER() OVER (ORDER BY weighted_score_sum DESC, name ASC) as rank
      FROM brands
    )
    SELECT 
      rank,
      id,
      name,
      slug,
      asin_count,
      click_share_sum,
      conversion_share_sum,
      weighted_score_sum
    FROM ranked_brands
    WHERE id IN ${ids}
  `)

  return (result.rows as Record<string, unknown>[]).map((row) => ({
    rank: Number(row.rank),
    id: Number(row.id),
    name: String(row.name),
    slug: String(row.slug),
    asin_count: Number(row.asin_count || 0),
    click_share_sum: Number(row.click_share_sum || 0),
    conversion_share_sum: Number(row.conversion_share_sum || 0),
    weighted_score_sum: Number(row.weighted_score_sum || 0),
  }))
}
