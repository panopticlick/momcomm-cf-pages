import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'folder',
      type: 'select',
      options: [
        { label: 'Posts', value: 'posts' },
        { label: 'Avatars', value: 'avatars' },
        { label: 'Others', value: 'others' },
      ],
      defaultValue: 'others',
      admin: {
        position: 'sidebar',
      },
    },
  ],
  upload: true,
}
