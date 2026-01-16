import { getPayloadClient } from '@/lib/payload'

/**
 * 同步 Brand 和 Topic 的关联关系
 *
 * 逻辑:
 * 1. 通过 topics.name 匹配 aba_search_terms.keywords
 * 2. 通过 aba_search_terms.asin 匹配 products.asin
 * 3. 获取 products.brand_id 建立 brand-topic 关联
 * 4. 只处理尚未有 brand_topics 记录的 topics
 */
export async function syncBrandTopics() {
  const payload = await getPayloadClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = payload.db as any

  if (!db.pool) {
    throw new Error('Database pool not accessible')
  }

  const client = await db.pool.connect()
  const start = Date.now()

  try {
    // INSERT brand-topic 关联，跳过已存在的 topics
    // 同时更新 brands 的 topics_count 统计字段
    const query = `
      INSERT INTO brand_topics (brand_id, topic_id, created_at, updated_at)
      SELECT DISTINCT
        p.brand_id as brand_id,
        t.id as topic_id,
        NOW(),
        NOW()
      FROM topics t
      JOIN aba_search_terms ast ON ast.keywords = t.name
      JOIN products p ON p.asin = ast.asin
      WHERE p.active = true
        AND p.brand_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM brand_topics bt WHERE bt.topic_id = t.id
        )
      ON CONFLICT (brand_id, topic_id) DO NOTHING;

      UPDATE brands b
      SET topics_count = (
        SELECT COUNT(*)
        FROM brand_topics bt
        WHERE bt.brand_id = b.id
      );
    `

    console.log('Executing syncBrandTopics SQL...')
    const result = await client.query(query)
    const duration = Date.now() - start

    console.log(
      `Sync Brand Topics completed. Inserted/Ignored: ${result.rowCount} rows. Duration: ${duration}ms`,
    )

    return {
      success: true,
      count: result.rowCount,
      duration,
    }
  } catch (error) {
    console.error('Error syncing brand topics:', error)
    throw error
  } finally {
    client.release()
  }
}
