import type { CollectionConfig, Payload } from 'payload'

import { convertToSlug } from '@/utilities/convert-to-slug'
import type { Post as PostType } from '@/payload-types'
import {
  normalizeTagTokens,
  resolvePostContentType,
  resolvePostSilo,
} from '@/services/momcomm/post-routing'

async function resolveTagTokens(payload: Payload, tags?: PostType['tags'] | null) {
  if (!tags || !Array.isArray(tags) || tags.length === 0) return []

  const tagObjects: Array<{ name?: string; slug?: string }> = []
  const tagIds: Array<string | number> = []

  for (const tag of tags) {
    if (!tag) continue

    if (typeof tag === 'number') {
      tagIds.push(tag)
      continue
    }

    if (typeof tag === 'string') {
      if (/^\d+$/.test(tag)) {
        tagIds.push(tag)
      } else {
        tagObjects.push({ name: tag, slug: tag })
      }
      continue
    }

    if (typeof tag === 'object') {
      if ('value' in tag) {
        const value = (tag as { value?: unknown }).value
        if (typeof value === 'string' || typeof value === 'number') {
          tagIds.push(value)
        } else if (value && typeof value === 'object') {
          tagObjects.push(value as { name?: string; slug?: string })
        }
      } else {
        tagObjects.push(tag as { name?: string; slug?: string })
      }
    }
  }

  if (tagIds.length > 0) {
    const resolvedTags = await payload.find({
      collection: 'tags',
      where: {
        id: { in: tagIds },
      },
      limit: tagIds.length,
    })

    tagObjects.push(
      ...resolvedTags.docs.map((tag) => ({
        name: tag.name,
        slug: tag.slug,
      })),
    )
  }

  return normalizeTagTokens(tagObjects)
}

export const Post: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'ai_status', 'updatedAt'],
    components: {
      beforeListTable: ['./components/payload/post-status-summary#PostStatusSummary'],
      views: {
        list: {
          actions: ['./components/payload/post-import-csv#PostImportCSV'],
        },
      },
    },
    preview: (doc) => {
      if (doc?.slug) {
        return `${process.env.NEXT_PUBLIC_SITE_URL || ''}/post/${doc.slug}?preview=true`
      }
      return null
    },
  },
  endpoints: [
    {
      path: '/summary',
      method: 'get',
      handler: async (req) => {
        const statuses = [
          'pending',
          'processing_content',
          'processing_media',
          'content_completed',
          'media_completed',
          'completed',
        ]
        const counts: Record<string, number> = {}

        await Promise.all(
          statuses.map(async (status) => {
            const result = await req.payload.find({
              collection: 'posts',
              where: {
                ai_status: {
                  equals: status,
                },
              },
              limit: 0,
              depth: 0,
            })
            counts[status] = result.totalDocs
          }),
        )

        return Response.json(counts)
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data.status === 'published' && !data.published_at) {
          data.published_at = new Date().toISOString()
        }
        return data
      },
      async ({ data, req, originalDoc }) => {
        const currentSilo = (data.silo ?? originalDoc?.silo ?? null) as PostType['silo'] | null
        const currentContentType = (data.content_type ?? originalDoc?.content_type ?? null) as
          | PostType['content_type']
          | null

        if (currentSilo && currentContentType) {
          return data
        }

        const tagTokens = await resolveTagTokens(
          req.payload,
          (data.tags ?? originalDoc?.tags) as PostType['tags'],
        )

        const resolvedContentType =
          currentContentType ||
          resolvePostContentType({ content_type: currentContentType, tags: [] }, tagTokens)

        if (!currentContentType && resolvedContentType) {
          data.content_type = resolvedContentType
        }

        const resolvedSilo =
          currentSilo ||
          resolvePostSilo(
            { silo: currentSilo, content_type: resolvedContentType || null, tags: [] },
            tagTokens,
          )

        if (!currentSilo && resolvedSilo) {
          data.silo = resolvedSilo
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        components: {
          Field: './components/payload/slug-component#SlugComponent',
        },
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (value && typeof value === 'string') {
              return convertToSlug(value)
            }
            if (data?.title && typeof data.title === 'string') {
              return convertToSlug(data.title)
            }
            return value
          },
        ],
      },
    },
    {
      name: 'featured_media',
      type: 'upload',
      relationTo: 'media',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'silo',
      type: 'select',
      options: [
        { label: 'Gear', value: 'gear' },
        { label: 'Stack', value: 'stack' },
        { label: 'Ventures', value: 'ventures' },
        { label: 'Library', value: 'library' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'content_type',
      type: 'select',
      options: [
        { label: 'Article', value: 'article' },
        { label: 'Directory', value: 'directory' },
        { label: 'Workflow', value: 'workflow' },
        { label: 'Blueprint', value: 'blueprint' },
        { label: 'Build in Public', value: 'build-in-public' },
        { label: 'Download', value: 'download' },
        { label: 'Update', value: 'update' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'external_url',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'External link for directory entries or offsite resources.',
      },
    },
    {
      name: 'download_url',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'Direct download link if hosted externally.',
      },
    },
    {
      name: 'download_file',
      type: 'upload',
      relationTo: 'media',
      admin: {
        position: 'sidebar',
        description: 'Upload a downloadable asset for library resources.',
      },
    },
    // SEO fields
    {
      name: 'meta_title',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'keywords',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'meta_description',
      type: 'textarea',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'authors',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      admin: {
        position: 'sidebar',
      },
      defaultValue: ({ user }: { user: any }) => (user ? [user.id] : []),
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
    },
    {
      name: 'content',
      type: 'richText',
    },
    {
      name: 'ai_status',
      type: 'select',
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Processing Content', value: 'processing_content' },
        { label: 'Processing Media', value: 'processing_media' },
        { label: 'Content Generated', value: 'content_completed' },
        { label: 'Media Generated', value: 'media_completed' },
        { label: 'Completed', value: 'completed' },
      ],
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'published_at',
      type: 'date',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
