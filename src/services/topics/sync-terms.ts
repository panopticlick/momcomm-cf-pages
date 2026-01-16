import { convertToSlug } from '@/utilities/convert-to-slug'
import { getPayloadClient } from '@/lib/payload'

export async function syncTopicsFromTerms() {
  const payload = await getPayloadClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = payload.db as any

  if (!db.pool) {
    throw new Error('Database pool not accessible')
  }

  const client = await db.pool.connect()
  let topicsToInsert: any[] = []

  try {
    // 1. Find high-frequency keywords from active products not in topics
    const query = `
      SELECT
        ast.keywords,
        SUM(COALESCE(ast.conversion_share, 0)) as conversion_share_sum,
        SUM(COALESCE(ast.click_share, 0)) as click_share_sum,
        SUM(COALESCE(ast.weighted_score, 0)) as weighted_score_sum,
        MAX(ast.start_date) as start_date,
        MAX(ast.end_date) as end_date
      FROM aba_search_terms ast
      INNER JOIN products p ON ast.asin = p.asin
      WHERE p.active = true
      GROUP BY ast.keywords
      HAVING COUNT(DISTINCT ast.asin) >= 3
      AND ast.keywords NOT IN (SELECT name FROM topics)
    `

    const result = await client.query(query)
    topicsToInsert = result.rows
  } catch (error) {
    console.error('Error querying topics candidates:', error)
    throw error // Re-throw to stop execution if query fails
  } finally {
    client.release()
  }

  // 2. Insert using Payload Local API to leverage hooks
  let insertedCount = 0
  let skippedCount = 0

  console.log(`Found ${topicsToInsert.length} potential topics to insert.`)

  for (const row of topicsToInsert) {
    try {
      await payload.create({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        collection: 'topics' as any,
        data: {
          name: row.keywords,
          display_name: row.keywords,
          slug: convertToSlug(row.keywords),
          active: false,
          conversion_share_sum: parseFloat(row.conversion_share_sum),
          click_share_sum: parseFloat(row.click_share_sum),
          weighted_score_sum: parseFloat(row.weighted_score_sum),
          start_date: row.start_date,
          end_date: row.end_date,
        },
      })
      insertedCount++
    } catch (_error) {
      // Check for duplicate key error or validation error
      // Payload throws errors with messages/codes.
      // If it's a unique constraint violation, we just skip.
      skippedCount++
      // Optional: log specific errors if needed, but keeping it quiet for duplicates is usually fine
      // console.warn(`Failed to create topic '${keyword}':`, error.message)
    }
  }
  // 3. Sync Node Topics
  // Link Topics to Nodes based on Products
  let nodeTopicsCount = 0
  const client2 = await db.pool.connect()

  try {
    const nodeTopicsQuery = `
      INSERT INTO node_topics (node_id, topic_id, created_at, updated_at)
      SELECT
        n.id as node_id,
        t.id as topic_id,
        NOW(),
        NOW()
      FROM aba_search_terms ast
      CROSS JOIN LATERAL jsonb_array_elements_text(ast.node_ids) as nid_text
      JOIN nodes n ON n.node_id = nid_text
      JOIN topics t ON t.name = ast.keywords
      JOIN products p ON ast.asin = p.asin
      LEFT JOIN node_topics nt ON nt.node_id = n.id AND nt.topic_id = t.id
      WHERE nt.id IS NULL
        AND p.active = true
      GROUP BY n.id, t.id
      HAVING COUNT(DISTINCT ast.asin) >= 3
      ON CONFLICT (node_id, topic_id) DO NOTHING
    `
    const result = await client2.query(nodeTopicsQuery)
    nodeTopicsCount = result.rowCount || 0
  } catch (error) {
    console.error('Error syncing node topics:', error)
    // We don't throw here to allow the main sync to report success for topics
  } finally {
    client2.release()
  }

  return {
    found: topicsToInsert.length,
    insertedCount,
    skippedCount,
    nodeTopicsCount,
  }
}
