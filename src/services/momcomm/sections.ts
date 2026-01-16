import type { Payload } from 'payload'
import type { Post, Topic } from '@/payload-types'
import { getPayloadClient } from '@/lib/payload'
import { attachImagesToTopics } from '@/components/lib/topic-utils'
import type { TopicWithImage } from '@/components/frontend/node-topics'

type SectionQuery = {
  tags?: string[]
  limit?: number
  fallbackLimit?: number
  sort?: string
  silo?: 'gear' | 'stack' | 'ventures' | 'library'
  contentType?:
    | 'article'
    | 'directory'
    | 'workflow'
    | 'blueprint'
    | 'build-in-public'
    | 'download'
    | 'update'
}

const DEFAULT_LIMIT = 6

async function resolveTagIds(payload: Payload, tags: string[]) {
  if (!tags.length) return []
  const normalized = tags.map((tag) => tag.trim().toLowerCase())

  const tagDocs = await payload.find({
    collection: 'tags',
    where: {
      or: [{ slug: { in: normalized } }, { name: { in: tags } }, { name: { in: normalized } }],
    },
    limit: 100,
  })

  return tagDocs.docs.map((tag) => tag.id)
}

export async function getSectionPosts({
  tags = [],
  limit = DEFAULT_LIMIT,
  fallbackLimit = DEFAULT_LIMIT,
  sort = '-published_at',
  silo,
  contentType,
}: SectionQuery): Promise<Post[]> {
  const payload = await getPayloadClient()

  const tagIds = await resolveTagIds(payload, tags)
  const baseWhere: any = {
    status: { equals: 'published' },
  }

  const primaryWhere: any = { ...baseWhere }

  if (silo) primaryWhere.silo = { equals: silo }
  if (contentType) primaryWhere.content_type = { equals: contentType }
  if (tagIds.length > 0) primaryWhere.tags = { in: tagIds }

  const result = await payload.find({
    collection: 'posts',
    where: primaryWhere,
    sort,
    limit,
    depth: 2,
  })

  if (result.docs.length > 0 || !fallbackLimit) {
    return result.docs as Post[]
  }

  if (tagIds.length > 0 && (silo || contentType)) {
    const tagFallback = await payload.find({
      collection: 'posts',
      where: {
        ...baseWhere,
        tags: { in: tagIds },
      },
      sort,
      limit,
      depth: 2,
    })

    if (tagFallback.docs.length > 0) {
      return tagFallback.docs as Post[]
    }
  }

  const fallback = await payload.find({
    collection: 'posts',
    where: { status: { equals: 'published' } },
    sort,
    limit: fallbackLimit,
    depth: 2,
  })

  return fallback.docs as Post[]
}

export async function getSectionTopics({
  tags = [],
  limit = DEFAULT_LIMIT,
  fallbackLimit = DEFAULT_LIMIT,
  sort = '-updatedAt',
}: SectionQuery): Promise<TopicWithImage[]> {
  const payload = await getPayloadClient()

  const tagIds = await resolveTagIds(payload, tags)
  const where: any = {
    active: { equals: true },
  }

  if (tagIds.length > 0) {
    where.tags = { in: tagIds }
  }

  const result = await payload.find({
    collection: 'topics',
    where,
    sort,
    limit,
    depth: 1,
  })

  if (result.docs.length === 0 && fallbackLimit) {
    const fallback = await payload.find({
      collection: 'topics',
      where: { active: { equals: true } },
      sort,
      limit: fallbackLimit,
      depth: 1,
    })
    return attachImagesToTopics(payload, fallback.docs as Topic[])
  }

  return attachImagesToTopics(payload, result.docs as Topic[])
}
