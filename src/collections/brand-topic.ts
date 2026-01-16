import type { CollectionConfig } from 'payload'

export const BrandTopic: CollectionConfig = {
  slug: 'brand-topics',
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
      name: 'brand',
      type: 'relationship',
      relationTo: 'brands',
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
      fields: ['brand', 'topic'],
      unique: true,
    },
  ],
}
