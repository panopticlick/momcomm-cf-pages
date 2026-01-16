import type { CollectionConfig } from 'payload'

export const NodeTopic: CollectionConfig = {
  slug: 'node-topics',
  admin: {
    useAsTitle: 'id',
  },
  access: {
    read: () => true,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'node',
      type: 'relationship',
      relationTo: 'nodes',
      required: true,
      index: true,
    },
    {
      name: 'topic',
      type: 'relationship',
      relationTo: 'topics',
      required: true,
      index: true,
    },
  ],
  indexes: [
    {
      fields: ['node', 'topic'],
      unique: true,
    },
  ],
}
