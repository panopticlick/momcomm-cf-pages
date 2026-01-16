import { getPayloadClient } from '@/lib/payload'
import { sql } from '@payloadcms/db-postgres'
import type { Topic, AbaSearchTerm, User, Media } from '@/payload-types'
import { calculateBatchScores } from '@/lib/product-score'
import type { MergedProduct } from '@/components/frontend/topic/product-card'
import type { TopicWithImage } from '@/components/frontend/node-topics'

export interface TopicPageData {
  topic: Topic
  mergedProducts: MergedProduct[]
  relatedTopics: TopicWithImage[]
  breadcrumbNodes: Array<{ name: string; slug: string; id: string }>
  topBrands: Array<{
    name: string
    slug: string
    score: number
    percentage: number
    productCount: number
  }>
  dateRange: string | undefined
}

export async function getTopicPageData(
  slug: string,
  nodeId?: string,
): Promise<TopicPageData | null> {
  const payload = await getPayloadClient()

  // 1. Fetch Topic
  // Using raw SQL for efficiency
  const db = payload.db.drizzle

  // Helper to execute queries with timeout handling
  async function executeQueryWithTimeout<T>(
    queryPromise: Promise<T>,
    operation: string,
  ): Promise<T> {
    try {
      return await queryPromise
    } catch (error: any) {
      if (error.code === 'QueryCanceledError' || error.message?.includes('timeout')) {
        console.error(`Database query timeout in ${operation}:`, error)
        throw new Error(`Database query timeout: ${operation}`)
      }
      throw error
    }
  }

  // A. Fetch Topic Basics
  const topicUpdatedSlug = slug

  const result = await executeQueryWithTimeout(
    db.execute(sql`
    WITH current_topic AS (
      SELECT * FROM "topics" WHERE "slug" = ${topicUpdatedSlug}
      AND ("active" = true OR "redirect" = true)
      LIMIT 1
    )
    SELECT
        -- Topic Fields (aliased to avoid collision)
        ct.id as topic_id,
        ct.name as topic_name,
        ct.display_name as topic_display_name,
        ct.slug as topic_slug,
        ct.active as topic_active,
        ct.ai_status as topic_ai_status,
        ct.conversion_share_sum as topic_conversion_share_sum,
        ct.click_share_sum as topic_click_share_sum,
        ct.weighted_score_sum as topic_weighted_score_sum,
        ct.alias as topic_alias,
        ct.meta_title as topic_meta_title,
        ct.meta_description as topic_meta_description,
        ct.excerpt as topic_excerpt,
        ct.introductory as topic_introductory,
        ct.content as topic_content,
        ct.nodes_count as topic_nodes_count,
        ct.start_date as topic_start_date,
        ct.end_date as topic_end_date,
        ct.updated_at as topic_updated_at,
        ct.created_at as topic_created_at,
        ct.redirect as topic_redirect,
        ct.redirect_to as topic_redirect_to,

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
        p.image,
        b.slug as "brandSlug",
        b.name as "brandName",
        s.scraper_metadata as "scraperMetadata"
      FROM "aba_search_terms" ast
      JOIN current_topic ct ON ast.keywords = ct.name
      INNER JOIN "products" p ON ast.asin = p.asin AND p.active = true
      LEFT JOIN "product_scrapers" s ON ast.asin = s.asin AND s.active = true
      LEFT JOIN "brands" b ON p.brand_id = b.id
      ORDER BY "weighted_score" DESC
  `),
    'fetch topic data',
  )

  if (result.rows.length === 0) {
    return null
  }

  const firstRow = result.rows[0]

  // Helper to ensure date strings
  const toISOString = (date: any): string => {
    if (date instanceof Date) return date.toISOString()
    if (typeof date === 'string') return date
    return new Date().toISOString() // Fallback
  }

  const topic: Topic = {
    id: firstRow.topic_id as number,
    name: firstRow.topic_name as string,
    display_name: firstRow.topic_display_name as string,
    slug: firstRow.topic_slug as string,
    active: firstRow.topic_active as boolean,
    ai_status: firstRow.topic_ai_status as Topic['ai_status'],
    redirect: firstRow.topic_redirect as boolean,
    redirect_to: firstRow.topic_redirect_to as string,
    conversion_share_sum: Number(firstRow.topic_conversion_share_sum),
    click_share_sum: Number(firstRow.topic_click_share_sum),
    weighted_score_sum: Number(firstRow.topic_weighted_score_sum),
    alias: firstRow.topic_alias as string,
    meta_title: firstRow.topic_meta_title as string,
    meta_description: firstRow.topic_meta_description as string,
    excerpt: firstRow.topic_excerpt as string,
    introductory: firstRow.topic_introductory as any,
    content: firstRow.topic_content as any,
    nodes_count: Number(firstRow.topic_nodes_count),
    start_date: firstRow.topic_start_date ? toISOString(firstRow.topic_start_date) : null,
    end_date: firstRow.topic_end_date ? toISOString(firstRow.topic_end_date) : null,
    updatedAt: toISOString(firstRow.topic_updated_at),
    createdAt: toISOString(firstRow.topic_created_at),
  }

  // 1a. Fetch Authors & Tags
  let tags: Topic['tags'] = []
  try {
    const topicWithRelations = await payload.findByID({
      collection: 'topics',
      id: topic.id,
      depth: 2,
      select: {
        authors: true,
        tags: true,
      },
    })
    topic.authors = topicWithRelations.authors
    tags = topicWithRelations.tags
  } catch (error) {
    console.error('Error fetching topic authors:', error)
    topic.authors = []
  }

  const keyword = topic.name
  const rawRows = result.rows

  // Process rows into MergedProduct structure
  const productMap = new Map<string, MergedProduct>()

  for (const row of rawRows) {
    const asin = row.asin as string

    if (!productMap.has(asin)) {
      const productObj =
        row.paapi5 || row.image
          ? {
              paapi5: row.paapi5,
              image: row.image,
              brandSlug: row.brandSlug,
              brandName: row.brandName,
            }
          : null

      const scraperObj = row.scraperMetadata
        ? {
            scraperMetadata: row.scraperMetadata,
          }
        : null

      // Ensure productObj matches Product type structure roughly if needed,
      // but strictly we just need the fields explicitly used.
      // Casting to any used below for specific fields, can refine if needed.

      productMap.set(asin, {
        asin,
        abaSearchTerms: [],
        product: productObj as any,
        scraper: scraperObj as any,
        score: 6.0,
      })
    }

    // Construct term object from flat row
    // We only need the fields that are used in downstream calculation (score, etc.)
    const term: Partial<AbaSearchTerm> = {
      asin: row.asin as string,
      keywords: row.keywords as string,
      occurrences: Number(row.occurrences),
      conversion_share: Number(row.conversion_share),
      click_share: Number(row.click_share),
      weighted_score: Number(row.weighted_score),
      start_date: row.start_date ? toISOString(row.start_date) : null,
      end_date: row.end_date ? toISOString(row.end_date) : null,
    }

    productMap.get(asin)!.abaSearchTerms.push(term as AbaSearchTerm)
  }

  const filteredProducts = Array.from(productMap.values())

  // Sort by weighted_score
  filteredProducts.sort((a, b) => {
    const scoreA = a.abaSearchTerms[0]?.weighted_score || 0
    const scoreB = b.abaSearchTerms[0]?.weighted_score || 0
    return scoreB - scoreA
  })

  // Calculate scores
  const scoreMap = calculateBatchScores(filteredProducts as any)

  // Merge scores
  filteredProducts.forEach((p) => {
    p.score = scoreMap.get(p.asin) || 6.0
  })

  // C. Internal Links (Related Topics by Keywords)
  const distinctAsins = filteredProducts.map((p) => p.asin)

  if (distinctAsins.length > 0) {
    const internalLinksResult = await db.execute(sql`
        SELECT DISTINCT ast.asin, t.name, t.slug
        FROM "aba_search_terms" ast
        JOIN "topics" t ON t.name = ast.keywords
        WHERE ast.asin IN ${distinctAsins}
          AND t.active = true
          AND t.name != ${keyword}
    `)

    // Map back to products
    const linksMap = new Map<string, any[]>()
    for (const row of internalLinksResult.rows) {
      if (!linksMap.has(row.asin as string)) {
        linksMap.set(row.asin as string, [])
      }
      linksMap.get(row.asin as string)?.push({ name: row.name, slug: row.slug })
    }

    for (const p of filteredProducts) {
      if (linksMap.has(p.asin)) {
        p.relatedTopics = linksMap.get(p.asin)
      }
    }
  }

  // D. Related Topics
  let relatedTopics: TopicWithImage[] = []

  // 1. Try fetching by Tags
  const tagIds = Array.isArray(tags)
    ? tags.map((t) => (typeof t === 'object' && t !== null ? t.id : t))
    : []

  // 基础 topic IDs（从 tag 或 node 获取）
  let baseRelatedTopicIds: number[] = []

  if (tagIds.length > 0) {
    try {
      // 使用原生 SQL 查询，按 tag 交集数量排序（交集越多越相关）
      const relatedByTagsResult = await db.execute(sql`
        SELECT t.id, t.name, t.display_name, t.slug, t.excerpt, t.asin_count,
               COUNT(tr.tags_id) as tag_match_count
        FROM "topics" t
        JOIN "topics_rels" tr ON t.id = tr.parent_id AND tr.path = 'tags'
        WHERE tr.tags_id IN ${tagIds}
          AND t.id != ${topic.id}
          AND t.active = true
        GROUP BY t.id
        ORDER BY tag_match_count DESC, t.weighted_score_sum DESC NULLS LAST
        LIMIT 10
      `)
      baseRelatedTopicIds = relatedByTagsResult.rows.map((r: any) => r.id)
    } catch (e) {
      console.error('Error fetching related topics by tags:', e)
    }
  }

  // 2. Fallback to Node logic if no related topics found via Tags
  if (baseRelatedTopicIds.length === 0) {
    const relatedTopicsResult = await db.execute(sql`
      WITH current_node AS (
          SELECT node_id
          FROM "node_topics"
          WHERE topic_id = ${topic.id}
          LIMIT 1
      )
      SELECT t.id
      FROM "topics" t
      JOIN "node_topics" nt ON t.id = nt.topic_id
      WHERE nt.node_id = (SELECT node_id FROM current_node)
      AND t.id != ${topic.id}
      AND t.active = true
      LIMIT 10
    `)
    baseRelatedTopicIds = relatedTopicsResult.rows.map((r: any) => r.id)
  }

  // 3. 为 relatedTopics 获取完整数据（图片、作者等）
  if (baseRelatedTopicIds.length > 0) {
    // 使用 Payload 获取完整关系数据
    const relatedTopicsWithRelations = await payload.find({
      collection: 'topics',
      where: {
        id: { in: baseRelatedTopicIds },
      },
      depth: 2, // 获取 authors 和 avatar
      limit: 10,
    })

    // 按原排序顺序重排
    const topicMap = new Map(relatedTopicsWithRelations.docs.map((t) => [t.id, t]))
    const orderedTopics = baseRelatedTopicIds
      .map((id) => topicMap.get(id))
      .filter((t): t is Topic => t !== undefined)

    // OPTIMIZED: 批量获取所有相关 topic 的图片和产品数量（单个查询）
    const topicNames = orderedTopics.map((t) => t.name)

    const topicImagesMap = new Map<string, { imageUrl: string | null; productCount: number }>()

    try {
      const { rows } = await db.execute(sql`
        WITH ranked_products AS (
          SELECT
            ast.keywords,
            p.image,
            p.paapi5,
            COUNT(*) OVER (PARTITION BY ast.keywords) as total_count,
            ROW_NUMBER() OVER (PARTITION BY ast.keywords ORDER BY ast.weighted_score DESC) as rn
          FROM aba_search_terms ast
          JOIN products p ON ast.asin = p.asin
          WHERE ast.keywords IN ${topicNames}
            AND p.active = true
        )
        SELECT
          keywords,
          image,
          paapi5,
          total_count as product_count
        FROM ranked_products
        WHERE rn = 1
      `)

      for (const row of rows) {
        const keywords = row.keywords as string
        const paapi = row.paapi5 as any
        const imageUrl =
          paapi?.Images?.Primary?.Medium?.URL ||
          paapi?.Images?.Primary?.Large?.URL ||
          row.image ||
          null
        const productCount = Number(row.product_count || 0)

        topicImagesMap.set(keywords, { imageUrl, productCount })
      }
    } catch (e) {
      console.error('Error fetching batch topic images:', e)
    }

    // 映射到 TopicWithImage
    relatedTopics = orderedTopics.map((t) => {
      const imageData = topicImagesMap.get(t.name) || {
        imageUrl: null,
        productCount: t.asin_count || 0,
      }

      // 处理作者信息
      const authors = t.authors
        ?.map((author: any) => {
          if (typeof author === 'object' && author !== null && 'name' in author) {
            const user = author as User
            let avatarUrl = null
            if (user.avatar && typeof user.avatar === 'object' && 'url' in user.avatar) {
              avatarUrl = (user.avatar as Media).url
            }
            return {
              id: user.id || 0,
              name: user.name,
              slug: user.slug,
              avatarUrl,
            }
          }
          return null
        })
        .filter((a: any) => a !== null)

      return {
        id: t.id,
        name: t.name,
        display_name: t.display_name,
        slug: t.slug,
        excerpt: t.excerpt,
        imageUrl: imageData.imageUrl,
        productCount: imageData.productCount,
        authors,
      } as TopicWithImage
    })
  }

  // E. Breadcrumbs
  const breadcrumbNodes: Array<{ name: string; slug: string; id: string }> = []

  if (nodeId) {
    const breadcrumbResult = await db.execute(sql`
        WITH RECURSIVE node_path AS (
            SELECT id, node_id, display_name, slug, parent
            FROM "nodes"
            WHERE node_id = ${nodeId}
            
            UNION ALL
            
            SELECT n.id, n.node_id, n.display_name, n.slug, n.parent
            FROM "nodes" n
            INNER JOIN node_path np ON n.node_id = np.parent
        )
        SELECT * FROM node_path
     `)

    const rows = breadcrumbResult.rows
      .map((r: any) => ({
        name: r.display_name,
        slug: r.slug,
        id: r.node_id,
      }))
      .reverse()

    rows.forEach((r: any) => breadcrumbNodes.push(r))
  }

  // F. Top Brands Calculation
  const brandStats = new Map<
    string,
    { conversion: number; click: number; count: number; slug: string }
  >()
  let totalConversion = 0

  for (const item of filteredProducts) {
    const product = item.product as any
    const scraper = item.scraper
    const terms = item.abaSearchTerms as AbaSearchTerm[]

    const paapi = (product?.paapi5 || product?.['paapi5']) as any
    const scraperMeta = (scraper?.scraperMetadata || scraper?.['scraperMetadata']) as any

    // Prioritize DB brand name/slug if available
    const dbBrandName = product?.brandName as string | undefined
    const dbBrandSlug = product?.brandSlug as string | undefined

    const brandName =
      dbBrandName ||
      paapi?.ItemInfo?.ByLineInfo?.Brand?.DisplayValue ||
      paapi?.ItemInfo?.ByLineInfo?.Manufacturer?.DisplayValue ||
      scraperMeta?.brand ||
      'Other'

    const productConversion = terms.reduce((sum, term) => sum + (term.conversion_share || 0), 0)
    const productClick = terms.reduce((sum, term) => sum + (term.click_share || 0), 0)

    totalConversion += productConversion

    const current = brandStats.get(brandName) || { conversion: 0, click: 0, count: 0, slug: '' }

    // Update stats and preserve slug if we have it (either from DB or previous iteration)
    brandStats.set(brandName, {
      conversion: current.conversion + productConversion,
      click: current.click + productClick,
      count: current.count + 1,
      slug: dbBrandSlug || current.slug || '',
    })
  }

  if (brandStats.has('Other')) {
    brandStats.delete('Other')
  }

  const useConversion = totalConversion > 0

  const sortedBrands = Array.from(brandStats.entries())
    .map(([name, stats]) => ({
      name,
      slug: stats.slug,
      score: useConversion ? stats.conversion : stats.click,
      clickScore: stats.click,
      count: stats.count,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  const maxBrandScore = sortedBrands.length > 0 ? sortedBrands[0].score : 0

  const topBrands = sortedBrands.map((brand) => ({
    name: brand.name,
    slug: (brand as any).slug, // Ensure slug is passed
    score: brand.score,
    percentage: maxBrandScore > 0 ? Math.round((brand.score / maxBrandScore) * 100) : 0,
    productCount: brand.count,
  }))

  const dateRange =
    filteredProducts[0]?.abaSearchTerms[0]?.start_date &&
    filteredProducts[0]?.abaSearchTerms[0]?.end_date
      ? `${new Date(filteredProducts[0].abaSearchTerms[0].start_date!).toLocaleDateString()} - ${new Date(
          filteredProducts[0].abaSearchTerms[0].end_date!,
        ).toLocaleDateString()}`
      : undefined

  return {
    topic: topic,
    mergedProducts: filteredProducts,
    relatedTopics,
    breadcrumbNodes,
    topBrands,
    dateRange,
  }
}
