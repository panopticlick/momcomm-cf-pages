import type { CollectionConfig } from 'payload'

export const Brand: CollectionConfig = {
  slug: 'brands',
  admin: {
    useAsTitle: 'name',
    defaultColumns: [
      'name',
      'logo',
      'slug',
      'asin_count',
      'click_share_sum',
      'conversion_share_sum',
      'weighted_score_sum',
      'updatedAt',
    ],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'asin_count',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'topics_count',
      type: 'number',
      defaultValue: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
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
}
