import type { CollectionConfig } from 'payload'

const validateKeywords = (value: string | null | undefined) => {
  if (value && /[;,]/.test(value)) {
    return 'Keywords cannot contain "," or ";"'
  }
  return true
}

const lowercaseKeywords = ({ value }: { value?: unknown }) => {
  if (typeof value === 'string') {
    return value.toLowerCase()
  }
  return value
}

export const Task: CollectionConfig = {
  slug: 'tasks',
  admin: {
    useAsTitle: 'keywords',
    components: {
      beforeListTable: ['./components/payload/task-status-summary#TaskStatusSummary'],
    },
    defaultColumns: ['keywords', 'node_ids', 'status', 'message', 'completed_at'],
  },
  access: {
    read: () => true,
    // create: () => false,
    // update: () => false,
    // delete: () => false,
  },
  fields: [
    {
      name: 'keywords',
      type: 'text',
      required: true,
      validate: validateKeywords,
      hooks: {
        beforeChange: [lowercaseKeywords],
      },
    },
    {
      name: 'node_ids',
      type: 'json',
      required: false,
      admin: {
        components: {
          Field: '@/components/payload/node-selector#NodeSelector',
        },
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
      name: 'message',
      type: 'textarea',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'metadata',
      type: 'textarea',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'completed_at',
      type: 'date',
      index: true,
      admin: {
        readOnly: true,
      },
    },
  ],
  indexes: [
    {
      fields: ['keywords'],
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
              collection: 'tasks',
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
