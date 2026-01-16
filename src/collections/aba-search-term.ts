import type { CollectionConfig } from 'payload'

export const AbaSearchTerm: CollectionConfig = {
  slug: 'aba-search-terms',
  admin: {
    useAsTitle: 'keywords',
  },
  access: {
    read: () => true,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'keywords',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'asin',
      type: 'text',
      required: true,
      index: true,
    },
    {
      name: 'node_ids',
      type: 'json',
      admin: {
        description: 'Node IDs',
      },
    },
    {
      name: 'occurrences', // rank_count
      type: 'number',
      admin: {
        description: 'Occurrences',
      },
    },
    {
      name: 'search_rank', // rank_avg
      type: 'number',
      admin: {
        description: 'Search Rank',
      },
    },
    {
      name: 'conversion_share', // conversion_share_sum
      type: 'number',
      admin: {
        description: 'Conversion Share',
      },
    },
    {
      name: 'click_share', // click_share_sum
      type: 'number',
      admin: {
        description: 'Click Share',
      },
    },
    {
      name: 'weighted_score', // weighted_score_sum
      type: 'number',
      admin: {
        description: 'Weighted Score',
      },
    },
    {
      name: 'start_date',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'end_date',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
  ],
  indexes: [
    {
      fields: ['keywords', 'asin'],
      unique: true,
    },
  ],
}
