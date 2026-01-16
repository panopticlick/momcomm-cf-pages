import { CollectionConfig } from 'payload'
import { getPreviewDataHandler } from './ai-block/endpoints/get-preview-data'
import { testPromptHandler } from './ai-block/endpoints/test-prompt'
import { renderPromptHandler } from './ai-block/endpoints/render-prompt'

export const AiBlock: CollectionConfig = {
  slug: 'ai-blocks',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'active', 'node', 'authors', 'updatedAt'],
  },
  fields: [
    {
      name: 'node',
      type: 'relationship',
      relationTo: 'nodes',
      required: false,
      hasMany: false,
      index: true,
      admin: {
        components: {
          Field: '/components/payload/node-ajax-select#NodeAjaxSelect',
        },
        description: 'The node this AI block belongs to',
      },
    },
    {
      name: 'title',
      required: true,
      type: 'text',
      admin: {
        description: 'The title of this AI block',
      },
    },
    {
      name: 'prompt_metadata',
      required: true,
      type: 'textarea',
      admin: {
        description:
          'The prompt used to generate the metadata, support simple {{ key }} replacement.',
        rows: 4,
      },
    },
    {
      name: 'prompt_content',
      type: 'textarea',
      required: true,
      admin: {
        description: 'The prompt used to generate the content',
        rows: 6,
      },
    },
    {
      name: 'prompt_preview',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '/components/payload/ai-block/prompt-preview#PromptPreview',
        },
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      label: 'Active',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'authors',
      type: 'relationship',
      relationTo: ['users'], // random select one user for topic author
      required: true,
      hasMany: true,
      defaultValue: ({ user }: { user: any }) =>
        user ? [{ relationTo: 'users', value: user.id }] : [],
      admin: {
        position: 'sidebar',
      },
    },
  ],

  hooks: {
    beforeDelete: [
      async ({ req, id }) => {
        try {
          await req.payload.delete({
            collection: 'ai-block-jobs',
            where: {
              ai_block: { equals: id },
            },
          })
        } catch (error) {
          req.payload.logger.error({ msg: 'Error deleting related ai-block-jobs', error })
        }
      },
    ],
  },
  endpoints: [
    {
      path: '/preview-data',
      method: 'get',
      handler: getPreviewDataHandler,
    },
    {
      path: '/test-prompt',
      method: 'post',
      handler: testPromptHandler,
    },
    {
      path: '/render-prompt',
      method: 'post',
      handler: renderPromptHandler,
    },
  ],
}
