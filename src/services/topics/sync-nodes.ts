import { getPayloadClient } from '@/lib/payload'

export async function syncNodeTopics() {
  const payload = await getPayloadClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = payload.db as any

  if (!db.pool) {
    throw new Error('Database pool not accessible')
  }

  const client = await db.pool.connect()
  const start = Date.now()

  try {
    // We limit the sync to topics that don't have any node_topics yet to avoid redundant work.
    // Logic:
    // 1. Select Topics that satisfy: NOT EXISTS (SELECT 1 FROM node_topics WHERE topic_id = topics.id)
    // 2. Join AbaSearchTerms on name = keywords
    // 3. Join Products on asin (ensure active)
    // 4. Extract node_ids and join Nodes

    // Note: We use DISTINCT to handle multiple search terms mapping to the same node for a topic.
    const query = `
      INSERT INTO node_topics (node_id, topic_id, created_at, updated_at)
      SELECT DISTINCT
        n.id as node_id,
        t.id as topic_id,
        NOW(),
        NOW()
      FROM topics t
      JOIN aba_search_terms ast ON ast.keywords = t.name
      JOIN products p ON p.asin = ast.asin
      CROSS JOIN LATERAL jsonb_array_elements_text(ast.node_ids) as nid_text
      JOIN nodes n ON n.node_id = nid_text
      WHERE p.active = true
        AND NOT EXISTS (
          SELECT 1 FROM node_topics nt WHERE nt.topic_id = t.id
        )
      ON CONFLICT (node_id, topic_id) DO NOTHING;

      UPDATE topics t
      SET nodes_count = (
        SELECT COUNT(*)
        FROM node_topics nt
        WHERE nt.topic_id = t.id
      ),
      asin_count = (
        SELECT COUNT(DISTINCT ast.asin)
        FROM aba_search_terms ast
        JOIN products p ON p.asin = ast.asin
        WHERE ast.keywords = t.name
          AND p.active = true
      );

      UPDATE nodes n
      SET topics_count = (
        SELECT COUNT(*)
        FROM node_topics nt
        WHERE nt.node_id = n.id
      );
    `

    console.log('Executing syncNodeTopics SQL...')
    const result = await client.query(query)
    const duration = Date.now() - start

    console.log(
      `Sync Node Topics completed. Inserted/Ignored: ${result.rowCount} rows. Duration: ${duration}ms`,
    )

    return {
      success: true,
      count: result.rowCount,
      duration,
    }
  } catch (error) {
    console.error('Error syncing node topics:', error)
    throw error
  } finally {
    client.release()
  }
}
