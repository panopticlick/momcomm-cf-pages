import type { CollectionConfig } from 'payload'

export const Product: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'asin',
    components: {
      beforeListTable: ['./components/payload/product-status-summary#ProductStatusSummary'],
    },
    defaultColumns: [
      'asin',
      'image',
      'brand',
      'active',
      'status',
      'click_share_sum',
      'conversion_share_sum',
      'weighted_score_sum',
      'updatedAt',
    ],
  },
  access: {
    read: () => true,
    create: () => false,
    update: () => true,
    delete: () => false,
  },
  fields: [
    {
      name: 'asin',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'brand',
      type: 'relationship',
      relationTo: 'brands',
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      index: true,
    },
    {
      name: 'image',
      type: 'text',
      admin: {
        components: {
          Cell: './components/payload/product-image-cell#ProductImageCell',
        },
      },
    },
    {
      name: 'paapi5',
      type: 'json',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'PENDING',
      options: [
        {
          label: 'Pending',
          value: 'PENDING',
        },
        {
          label: 'Processing',
          value: 'PROCESSING',
        },
        {
          label: 'Completed',
          value: 'COMPLETED',
        },
        {
          label: 'Error',
          value: 'ERROR',
        },
        {
          label: 'Not Found',
          value: 'NOT_FOUND',
        },
      ],
      index: true,
    },
    {
      name: 'message',
      type: 'textarea',
    },
    {
      name: 'completed_at',
      type: 'date',
    },
    {
      name: 'click_share_sum',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'conversion_share_sum',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'weighted_score_sum',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
  ],
  endpoints: [
    {
      path: '/summary',
      method: 'get',
      handler: async (req) => {
        const statuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'ERROR', 'NOT_FOUND']
        const counts: Record<string, number> = {}

        await Promise.all(
          statuses.map(async (status) => {
            const result = await req.payload.find({
              collection: 'products',
              where: {
                status: {
                  equals: status,
                },
              },
              limit: 1,
              depth: 0,
            })
            counts[status] = result.totalDocs
          }),
        )

        return Response.json(counts)
      },
    },
  ],
}
