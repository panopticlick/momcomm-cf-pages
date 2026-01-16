import type { CollectionConfig } from 'payload'

export const SearchTermAsinJob: CollectionConfig = {
  slug: 'search-term-asin-jobs',
  admin: {
    useAsTitle: 'keywords',
    components: {
      beforeListTable: [
        './components/payload/search-term-asin-job-status-summary#SearchTermAsinJobStatusSummary',
      ],
    },
    defaultColumns: ['keywords', 'status', 'offset', 'limit', 'message', 'completed_at'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'task',
      type: 'relationship',
      relationTo: 'tasks',
      required: true,
      index: true,
    },
    {
      name: 'keywords',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'node_ids',
      type: 'json',
      admin: {
        description: 'Node IDs for filtering',
      },
    },
    {
      name: 'offset',
      type: 'number',
      required: true,
    },
    {
      name: 'limit',
      type: 'number',
      required: true,
      defaultValue: 1000,
    },
    {
      name: 'total',
      type: 'number',
      admin: {
        description: 'Total records in API response',
      },
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
      ],
      index: true,
    },
    {
      name: 'body',
      type: 'json',
      admin: {
        description: 'Job response body',
      },
    },
    {
      name: 'message',
      type: 'textarea',
      admin: {
        description: 'Job message or error details',
      },
    },
    {
      name: 'completed_at',
      type: 'date',
      index: true,
      admin: {
        readOnly: true,
        description: 'Job completion time',
      },
    },
  ],
  endpoints: [
    {
      path: '/summary',
      method: 'get',
      handler: async (req) => {
        const statuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'ERROR']
        const counts: Record<string, number> = {}

        await Promise.all(
          statuses.map(async (status) => {
            const result = await req.payload.find({
              collection: 'search-term-asin-jobs',
              where: {
                status: {
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
}
