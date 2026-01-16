import { Payload } from 'payload'
import { Post } from '@/payload-types'
import { sql } from '@payloadcms/db-postgres'
import { hasDrizzle } from '@/lib/payload'

export async function getRelatedPosts({
  payload,
  currentPostId,
  tagIds,
  limit = 3,
}: {
  payload: Payload
  currentPostId: number
  tagIds: (string | number)[]
  limit?: number
}): Promise<Post[]> {
  if (!tagIds.length) return []

  // Ensure tag IDs are numbers for the SQL query (since schema uses integers)
  const numericTagIds = tagIds.map((id) => Number(id)).filter((id) => !isNaN(id))

  if (numericTagIds.length === 0) return []

  try {
    // Access the Drizzle instance from Payload (Postgres adapter specific)
    if (!hasDrizzle(payload.db)) {
      throw new Error('Database adapter does not support drizzle')
    }
    const db = payload.db.drizzle

    // Execute raw SQL to find related posts ordered by tag intersection count
    // The query:
    // 1. Joins posts with posts_rels (where tags are stored)
    // 2. Filters by published status, excludes current post, and matches given tags
    // 3. Groups by post ID
    // 4. Orders by count of matching tags (DESC) and then published date (DESC)
    const result = await db.execute(sql`
      SELECT
        p.id,
        COUNT(pr.tags_id) as overlap_count
      FROM
        posts p
      JOIN
        posts_rels pr ON p.id = pr.parent_id
      WHERE
        p.id != ${currentPostId}
        AND p.status = 'published'
        AND pr.path = 'tags'
        AND pr.tags_id IN ${numericTagIds}
      GROUP BY
        p.id, p.published_at
      ORDER BY
        overlap_count DESC,
        p.published_at DESC
      LIMIT ${limit}
    `)

    const rows = result.rows as { id: number }[]

    if (rows.length === 0) return []

    const relatedIds = rows.map((row) => row.id)

    // Fetch full post objects using Payload API to ensure hooks/population works as expected
    const { docs } = await payload.find({
      collection: 'posts',
      where: {
        id: {
          in: relatedIds,
        },
      },
      depth: 1,
      limit: limit,
      pagination: false,
    })

    // Restore the specific order from the SQL query (since SQL 'IN' doesn't guarantee order)
    const orderedDocs = relatedIds
      .map((id) => docs.find((doc) => doc.id === id))
      .filter((doc): doc is Post => !!doc)

    return orderedDocs
  } catch (error) {
    console.error('Error fetching related posts via SQL:', error)
    // Fallback to empty strictly, or could fallback to basic query if needed
    return []
  }
}
