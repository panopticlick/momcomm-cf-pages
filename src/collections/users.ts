import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'slug'],
    preview: (doc) => {
      if (doc?.slug) {
        return `${process.env.NEXT_PUBLIC_SITE_URL || ''}/author/${doc.slug}`
      }
      return null
    },
  },
  auth: {
    useAPIKey: true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'URL friendly identifier',
      },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'job_title',
      type: 'text',
    },
    {
      name: 'bio',
      type: 'textarea',
    },
    // Email added by default
  ],
}
