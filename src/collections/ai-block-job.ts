import type { CollectionConfig } from 'payload'

export const AiBlockJob: CollectionConfig = {
  slug: 'ai-block-jobs',
  admin: {
    useAsTitle: 'id',
    components: {
      beforeListTable: ['./components/payload/ai-block-job-status-summary#AiBlockJobStatusSummary'],
    },
    defaultColumns: ['topic', 'ai_block', 'type', 'status', 'updatedAt'],
  },
  fields: [
    {
      name: 'topic',
      type: 'relationship',
      relationTo: 'topics',
      required: true,
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'ai_block',
      type: 'relationship',
      relationTo: 'ai-blocks',
      required: true,
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        {
          label: 'Metadata',
          value: 'metadata',
        },
        {
          label: 'Content',
          value: 'content',
        },
      ],
      index: true,
      admin: {
        readOnly: true,
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
      name: 'data',
      type: 'json',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'message',
      type: 'textarea',
      admin: {
        description: 'Error message or processing logs',
        readOnly: true,
      },
    },
  ],
  indexes: [
    {
      fields: ['topic', 'type'],
      unique: true,
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
              collection: 'ai-block-jobs',
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
