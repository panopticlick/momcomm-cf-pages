import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'
import type { TopicWithImage } from '@/components/frontend/node-topics'
import type { Topic, Media, User } from '@/payload-types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getProductImageFromPaapi(paapi: any, fallbackImage?: string | null): string | null {
  if (!paapi && !fallbackImage) return null

  return (
    paapi?.Images?.Primary?.Medium?.URL ||
    paapi?.Images?.Primary?.Large?.URL ||
    fallbackImage ||
    null
  )
}

export async function attachImagesToTopics(
  payload: Payload,
  topics: Topic[],
): Promise<TopicWithImage[]> {
  return Promise.all(
    topics.map(async (topic) => {
      let imageUrl: string | null = null
      let productCount = 0

      // Map authors with avatar
      const authors = topic.authors
        ?.map((author) => {
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
        .filter(
          (
            a,
          ): a is {
            id: number
            name: string
            slug: string
            avatarUrl: string | null | undefined
          } => a !== null,
        )

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { rows } = await (payload.db as any).drizzle.execute(sql`
          SELECT
            p.image,
            p.paapi5,
            count(*) OVER() as total_count
          FROM aba_search_terms ast
          JOIN products p ON ast.asin = p.asin
          WHERE ast.keywords = ${topic.name}
            AND p.active = true
          ORDER BY ast.weighted_score DESC
          LIMIT 1
        `)

        if (rows.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const row = rows[0] as any
          imageUrl = getProductImageFromPaapi(row.paapi5, row.image)
          productCount = Number(row.total_count || 0)
        }
      } catch (error) {
        console.error(`Error fetching image for topic ${topic.name}:`, error)
      }

      return {
        ...topic,
        imageUrl,
        productCount,
        authors: authors as any,
      } as TopicWithImage
    }),
  )
}
