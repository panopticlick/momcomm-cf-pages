import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { enrichTopicsWithImage } from '@/services/topics/enrich'

export type ShortcodeArgs = {
  tags?: string[]
  search?: string
  limit?: number
  h2?: string
  h3?: string
  subtitle?: string
  excludeSlug?: string
  _id?: string
}

// 获取 Payload 实例
async function getPayloadClient() {
  return await getPayload({ config: configPromise })
}

/**
 * 获取 Topics (支持按 Tags 或关键词搜索)
 */
export const getTopics = async ({ tags, search, limit = 5, excludeSlug }: ShortcodeArgs) => {
  const payload = await getPayloadClient()

  // 必须至少提供 tags 或 search 之一，否则返回空数组
  if ((!tags || tags.length === 0) && !search) {
    return []
  }

  const where: any = {
    active: { equals: true },
  }

  // 0. Exclude Slug
  if (excludeSlug) {
    where.slug = { not_equals: excludeSlug }
  }

  // 1. Tags 过滤
  if (tags && tags.length > 0) {
    const tagDocs = await payload.find({
      collection: 'tags',
      where: {
        name: { in: tags },
      },
      limit: 100,
    })

    const tagIds = tagDocs.docs.map((tag) => tag.id)

    if (tagIds.length === 0) return []

    where.tags = { in: tagIds }
  }

  // 2. Search 过滤
  if (search) {
    where.or = [{ name: { contains: search } }]
  }

  const topics = await payload.find({
    collection: 'topics',
    where,
    limit,
  })

  return await enrichTopicsWithImage(payload, topics.docs)
}

/**
 * 根据 Tags 获取 Posts
 */
export const getPostsByTags = async (tags: string[], limit: number = 6, excludeSlug?: string) => {
  const payload = await getPayloadClient()

  // 1. 查找 Tag IDs
  const tagDocs = await payload.find({
    collection: 'tags',
    where: {
      name: { in: tags },
    },
    limit: 100,
  })

  const tagIds = tagDocs.docs.map((tag) => tag.id)

  if (tagIds.length === 0) return []

  const where: any = {
    tags: { in: tagIds },
    status: { equals: 'published' },
  }

  if (excludeSlug) {
    where.slug = { not_equals: excludeSlug }
  }

  // 2. 查找 Posts
  const posts = await payload.find({
    collection: 'posts',
    where,
    limit,
  })

  return posts.docs
}
