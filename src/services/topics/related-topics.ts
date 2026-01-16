import { Payload } from 'payload'
import { Topic, User, Media } from '@/payload-types'
import { sql } from '@payloadcms/db-postgres'
import type { TopicWithImage } from '@/components/frontend/node-topics'
import { enrichTopicsWithImage } from './enrich'
import { hasDrizzle } from '@/lib/payload'

export async function getRelatedTopics({
  payload,
  tagIds,
  currentTopicId,
  limit = 6,
}: {
  payload: Payload
  tagIds: (string | number)[]
  currentTopicId?: number
  limit?: number
}): Promise<TopicWithImage[]> {
  if (!tagIds.length) return []

  const numericTagIds = tagIds.map((id) => Number(id)).filter((id) => !isNaN(id))
  if (numericTagIds.length === 0) return []

  try {
    if (!hasDrizzle(payload.db)) {
      throw new Error('Database adapter does not support drizzle')
    }
    const db = payload.db.drizzle

    // 1. Find related topic IDs by tag overlap
    // Note: topics_rels table and tags path are assumed based on standard Payload naming convention
    // and verified in get-topic-page-data.ts
    const relatedByTagsResult = await db.execute(sql`
      SELECT t.id, COUNT(tr.tags_id) as tag_match_count
      FROM "topics" t
      JOIN "topics_rels" tr ON t.id = tr.parent_id AND tr.path = 'tags'
      WHERE tr.tags_id IN ${numericTagIds}
        ${currentTopicId ? sql`AND t.id != ${currentTopicId}` : sql``}
        AND t.active = true
      GROUP BY t.id
      ORDER BY tag_match_count DESC, t.weighted_score_sum DESC NULLS LAST
      LIMIT ${limit}
    `)

    const relatedIds = relatedByTagsResult.rows.map((r: any) => r.id as number)
    if (relatedIds.length === 0) return []

    // 2. Fetch full topic objects
    const { docs } = await payload.find({
      collection: 'topics',
      where: {
        id: {
          in: relatedIds,
        },
      },
      depth: 2,
      limit: limit,
      pagination: false,
    })

    // 3. Transform to TopicWithImage
    const topicMap = new Map(docs.map((t) => [t.id, t]))
    const orderedTopics = relatedIds
      .map((id) => topicMap.get(id))
      .filter((t): t is Topic => t !== undefined)

    return await enrichTopicsWithImage(payload, orderedTopics)
  } catch (error) {
    console.error('Error fetching related topics:', error)
    return []
  }
}
