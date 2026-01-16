'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'

export interface SearchResult {
  id: string | number
  name: string
  display_name?: string | null
  slug: string
}

export interface TopicWithImage extends SearchResult {
  id: number
  imageUrl: string | null
  productCount: number
}

export interface SearchResponse {
  docs: TopicWithImage[]
  totalDocs: number
  totalPages: number
  page: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export async function searchTopicsWithImages(
  query: string,
  limit: number = 24,
  page: number = 1,
): Promise<SearchResponse> {
  if (!query || query.trim().length === 0) {
    return {
      docs: [],
      totalDocs: 0,
      totalPages: 0,
      page: 1,
      hasNextPage: false,
      hasPrevPage: false,
    }
  }

  const payload = await getPayload({ config })

  try {
    const results = await payload.find({
      collection: 'topics',
      limit,
      page,
      where: {
        and: [
          {
            or: [
              {
                name: {
                  like: query,
                },
              },
              {
                display_name: {
                  like: query,
                },
              },
              {
                meta_title: {
                  like: query,
                },
              },
            ],
          },
          {
            active: {
              equals: true,
            },
          },
        ],
      },
    })

    const topics = results.docs

    const topicsWithImages: TopicWithImage[] = await Promise.all(
      topics.map(async (topic) => {
        let imageUrl: string | null = null
        let productCount = 0

        try {
          const { rows } = await payload.db.drizzle.execute(sql`
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
            const paapi = row.paapi5
            imageUrl =
              paapi?.Images?.Primary?.Medium?.URL ||
              paapi?.Images?.Primary?.Large?.URL ||
              row.image ||
              null

            productCount = Number(row.total_count || 0)
          }
        } catch (error) {
          console.error(`Error fetching image for topic ${topic.name}:`, error)
        }

        return {
          id: topic.id as number,
          name: topic.name,
          display_name: topic.display_name,
          slug: topic.slug,
          imageUrl,
          productCount,
        }
      }),
    )

    return {
      docs: topicsWithImages,
      totalDocs: results.totalDocs,
      totalPages: results.totalPages,
      page: results.page || 1,
      hasNextPage: results.hasNextPage,
      hasPrevPage: results.hasPrevPage,
    }
  } catch (error) {
    console.error('Error searching topics with images:', error)
    return {
      docs: [],
      totalDocs: 0,
      totalPages: 0,
      page: 1,
      hasNextPage: false,
      hasPrevPage: false,
    }
  }
}

export async function searchTopics(query: string, limit: number = 5): Promise<SearchResult[]> {
  if (!query || query.trim().length === 0) {
    return []
  }

  const payload = await getPayload({ config })

  try {
    const results = await payload.find({
      collection: 'topics',
      limit,
      where: {
        and: [
          {
            or: [
              {
                name: {
                  like: query,
                },
              },
            ],
          },
          {
            active: {
              equals: true,
            },
          },
        ],
      },
    })

    return results.docs.map((doc) => ({
      id: doc.id,
      name: doc.name,
      display_name: doc.display_name,
      slug: doc.slug,
    }))
  } catch (error) {
    console.error('Error searching topics:', error)
    return []
  }
}
