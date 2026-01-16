import type { CollectionConfig } from 'payload'

export const ProductScraper: CollectionConfig = {
  slug: 'product-scrapers',
  admin: {
    useAsTitle: 'asin',
    components: {
      beforeListTable: [
        './components/payload/product-scraper-status-summary#ProductScraperStatusSummary',
      ],
    },
    defaultColumns: ['asin', 'active', 'status', 'message', 'completed_at'],
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
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      index: true,
    },
    {
      name: 'scraperMetadata',
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
              collection: 'product-scrapers',
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
