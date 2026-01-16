import { Payload } from 'payload'
import { Topic, User, Media } from '@/payload-types'
import { sql } from '@payloadcms/db-postgres'
import type { TopicWithImage } from '@/components/frontend/node-topics'
import { hasDrizzle } from '@/lib/payload'

export async function enrichTopicsWithImage(
  payload: Payload,
  topics: Topic[],
): Promise<TopicWithImage[]> {
  if (!topics || topics.length === 0) return []

  if (!hasDrizzle(payload.db)) {
    throw new Error('Database adapter does not support drizzle')
  }
  const db = payload.db.drizzle

  return await Promise.all(
    topics.map(async (t) => {
      let imageUrl: string | null = null
      let productCount = t.asin_count || 0

      // Fetch top product image
      try {
        const { rows } = await db.execute(sql`
          SELECT p.image, p.paapi5, count(*) OVER() as total_count
          FROM aba_search_terms ast
          JOIN products p ON ast.asin = p.asin
          WHERE ast.keywords = ${t.name}
            AND p.active = true
          ORDER BY ast.weighted_score DESC
          LIMIT 1
        `)

        if (rows.length > 0) {
          const row = rows[0] as any
          const paapi = row.paapi5
          imageUrl =
            paapi?.Images?.Primary?.Medium?.URL ||
            paapi?.Images?.Primary?.Large?.URL ||
            row.image ||
            null
          if (!productCount) {
            productCount = Number(row.total_count || 0)
          }
        }
      } catch (e) {
        console.error(`Error fetching image for topic ${t.name}:`, e)
      }

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
        .filter((a): a is NonNullable<typeof a> => a !== null)

      return {
        id: t.id,
        name: t.name,
        display_name: t.display_name,
        slug: t.slug,
        excerpt: t.excerpt,
        imageUrl,
        productCount,
        authors,
      } as TopicWithImage
    }),
  )
}
