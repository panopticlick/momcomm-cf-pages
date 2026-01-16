import { PayloadHandler } from 'payload'
import { getPayloadClient } from '@/lib/payload'

export const getPreviewDataHandler: PayloadHandler = async (req) => {
  const payload = await getPayloadClient()

  const db = payload.db.drizzle
  const { sql } = await import('@payloadcms/db-postgres')

  const result = await db.execute(sql`
    SELECT t.id
    FROM "topics" t
    JOIN "aba_search_terms" ast ON t.name = ast.keywords
    JOIN "products" p ON ast.asin = p.asin
    WHERE p.active = true
    GROUP BY t.id
    HAVING COUNT(DISTINCT p.asin) >= 3
    LIMIT 1
  `)

  if (result.rows.length === 0) {
    return Response.json(
      { error: 'No active topic with sufficient products found' },
      { status: 404 },
    )
  }

  const topicId = result.rows[0].id

  return Response.json({ id: topicId })
}
