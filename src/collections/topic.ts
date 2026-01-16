import type { CollectionConfig } from 'payload'
import { dedupeApplyHandler } from './topic/endpoints/dedupe-apply'
import { dedupePreviewHandler } from './topic/endpoints/dedupe-preview'

export const Topic: CollectionConfig = {
  slug: 'topics',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'active', 'requires_review', 'ai_status', 'slug', 'updatedAt'],
    components: {
      beforeListTable: [
        './components/payload/topic-dedupe-panel#TopicDedupePanel',
        './components/payload/topic-review-queue#TopicReviewQueue',
        './components/payload/topic-status-summary#TopicStatusSummary',
      ],
    },
    preview: (doc) => {
      if (doc?.slug) {
        return `${process.env.NEXT_PUBLIC_SITE_URL || ''}/gear/${doc.slug}`
      }
      return null
    },
  },
  endpoints: [
    {
      path: '/dedupe-preview',
      method: 'get',
      handler: dedupePreviewHandler,
    },
    {
      path: '/dedupe-apply',
      method: 'post',
      handler: dedupeApplyHandler,
    },
    {
      path: '/summary',
      method: 'get',
      handler: async (req) => {
        const statuses = [
          'PENDING',
          'QUEUED',
          'METADATA_PROCESSING',
          'METADATA_COMPLETED',
          'METADATA_ERROR',
          'CONTENT_PROCESSING',
          'CONTENT_COMPLETED',
          'CONTENT_ERROR',
          'COMPLETED',
        ]
        const counts: Record<string, number> = {}

        await Promise.all(
          statuses.map(async (status) => {
            const result = await req.payload.find({
              collection: 'topics',
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
        if (data.redirect_to) {
          data.redirect = true
          data.active = false
        } else {
          data.redirect = false
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
      unique: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
        components: {
          Cell: './components/payload/topic-name-cell#TopicNameCell',
        },
      },
    },
    {
      name: 'display_name',
      type: 'text',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'active',
      type: 'checkbox',
      index: true,
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'requires_review',
      type: 'checkbox',
      index: true,
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Must be reviewed before auto-publishing',
        components: {
          Cell: './components/payload/approve-topic-cell#ApproveTopicCell',
        },
      },
    },
    {
      name: 'ai_status',
      type: 'select',
      required: true,
      defaultValue: 'PENDING',
      hooks: {
        beforeChange: [
          ({ value, previousValue }) => {
            // 1. Allow Reset (Global)
            if (value === 'PENDING') return value

            const oldStatus = previousValue || 'PENDING'
            // 2. Allow Idempotency (No Change)
            if (value === oldStatus) return value

            // 3. Define valid error/retry transitions
            const allowedTransitions: Record<string, string[]> = {
              METADATA_PROCESSING: ['METADATA_ERROR'],
              METADATA_ERROR: ['METADATA_PROCESSING'],
              CONTENT_PROCESSING: ['CONTENT_ERROR'],
              CONTENT_ERROR: ['CONTENT_PROCESSING'],
            }

            if (allowedTransitions[oldStatus]?.includes(value)) {
              return value
            }

            // 4. Define Standard Success Pth
            const order = [
              'PENDING',
              'QUEUED',
              'METADATA_PROCESSING',
              'METADATA_COMPLETED',
              'CONTENT_PROCESSING',
              'CONTENT_COMPLETED',
              'COMPLETED',
            ]

            const oldIndex = order.indexOf(oldStatus)
            const newIndex = order.indexOf(value)

            // Validate strict linear progression for standard steps
            if (oldIndex !== -1 && newIndex !== -1) {
              if (newIndex === oldIndex + 1) {
                return value
              }
            }

            throw new Error(`Invalid ai_status transition from ${oldStatus} to ${value}`)
          },
        ],
      },
      options: [
        {
          label: 'Pending',
          value: 'PENDING',
        },
        {
          label: 'Queued',
          value: 'QUEUED',
        },
        {
          label: 'metadata processing',
          value: 'METADATA_PROCESSING',
        },
        {
          label: 'metadata completed',
          value: 'METADATA_COMPLETED',
        },
        {
          label: 'metadata error',
          value: 'METADATA_ERROR',
        },
        {
          label: 'content processing',
          value: 'CONTENT_PROCESSING',
        },
        {
          label: 'content completed',
          value: 'CONTENT_COMPLETED',
        },
        {
          label: 'content error',
          value: 'CONTENT_ERROR',
        },
        {
          label: 'completed',
          value: 'COMPLETED',
        },
      ],
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'click_share_sum',
      type: 'number',
      index: true,
      hidden: true,
      admin: {
        description: 'Click Share',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'weighted_score_sum',
      type: 'number',
      index: true,
      hidden: true,
      admin: {
        description: 'Weighted Score',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'alias',
      type: 'text',
    },
    {
      name: 'meta_title',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'meta_keywords',
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
        rows: 3,
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      admin: {
        position: 'sidebar',
        rows: 3,
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
      name: 'redirect',
      type: 'checkbox',
      index: true,
      defaultValue: false,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'redirect_to',
      type: 'text',
      admin: {
        description: 'Redirect URL, start with /',
        position: 'sidebar',
      },
    },
    {
      name: 'introductory',
      type: 'richText',
    },
    {
      name: 'content',
      type: 'richText',
      // 使用全局配置的 lexicalEditor，包含完整的工具栏功能
    },
    {
      name: 'authors',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      defaultValue: ({ user }: { user: any }) => (user ? [user.id] : []),
      hooks: {
        beforeChange: [
          async ({ value, req, data }) => {
            // 如果设置为激活且没有作者，则随机分配前10个用户中的一个作为作者
            if (data?.active && (!value || (Array.isArray(value) && value.length === 0))) {
              const { docs: users } = await req.payload.find({
                collection: 'users',
                limit: 10,
                depth: 0,
                overrideAccess: true,
              })
              if (users.length > 0) {
                const randomUser = users[Math.floor(Math.random() * users.length)]
                return [randomUser.id]
              }
            }
            return value
          },
        ],
      },
      admin: {
        position: 'sidebar',
      },
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
      name: 'nodes_count',
      type: 'number',
      defaultValue: 0,
      index: true,
      hidden: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'asin_count',
      type: 'number',
      defaultValue: 0,
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'conversion_share_sum',
      type: 'number',
      index: true,
      admin: {
        description: 'Conversion Share',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'start_date',
      type: 'date',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'end_date',
      type: 'date',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
  ],
}
