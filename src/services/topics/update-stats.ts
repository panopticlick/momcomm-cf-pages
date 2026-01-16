import { getPayloadClient } from '@/lib/payload'

export async function updateTopicsStats(options?: { since?: Date; incremental?: boolean }) {
  const payload = await getPayloadClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = payload.db as any

  if (!db.pool) {
    throw new Error('Database pool not accessible')
  }

  const client = await db.pool.connect()
  let updatedCount = 0

  try {
    // OPTIMIZED: Only update topics that have been modified since last update
    // If incremental mode is enabled and a timestamp is provided, only update changed topics
    const whereClause =
      options?.since && options?.incremental
        ? `WHERE ast.updated_at >= ${(options.since as any).toISOString()}`
        : ''

    const updateQuery = `
      UPDATE topics t
      SET
        conversion_share_sum = s.conversion_share_sum,
        click_share_sum = s.click_share_sum,
        weighted_score_sum = s.weighted_score_sum,
        start_date = s.start_date,
        end_date = s.end_date
      FROM (
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
        ${whereClause}
        GROUP BY ast.keywords
      ) s
      WHERE t.name = s.keywords
    `
    const result = await client.query(updateQuery)
    updatedCount = result.rowCount || 0
  } catch (error) {
    console.error('Error updating topics stats:', error)
    throw error
  } finally {
    client.release()
  }

  return {
    updatedCount,
  }
}
