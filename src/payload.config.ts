import { postgresAdapter } from '@payloadcms/db-postgres'
import {
  lexicalEditor,
  FixedToolbarFeature,
  UploadFeature,
  EXPERIMENTAL_TableFeature,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { s3Storage } from '@payloadcms/storage-s3'
import { z } from 'zod'

import { Users } from './collections/users'
import { Media } from './collections/media'

import { AbaSearchTerm } from './collections/aba-search-term'
import { Task } from './collections/task'
import { Node } from './collections/node'
import { Brand } from './collections/brand'
import { Product } from './collections/product'
import { ProductScraper } from './collections/product-scraper'
import { Topic } from './collections/topic'

import { NodeTopic } from './collections/node-topic'
import { BrandTopic } from './collections/brand-topic'

import { SearchTermAsinJob } from './collections/search-term-asin-job'
import { AiBlock } from './collections/ai-block'
import { AiBlockJob } from './collections/ai-block-job'
import { Tag } from './collections/tag'
import { Post } from './collections/post'
import { Subscriber } from './collections/subscriber'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Environment variable validation schema
const envSchema = z.object({
  // Required
  PAYLOAD_SECRET: z.string().min(1, 'PAYLOAD_SECRET is required and must not be empty'),
  DATABASE_URI: z.string().min(1, 'DATABASE_URI is required and must not be empty'),
  R2_PUBLIC_URL: z.string().url('R2_PUBLIC_URL must be a valid URL'),
  R2_BUCKET_NAME: z.string().min(1, 'R2_BUCKET_NAME is required'),
  R2_ENDPOINT: z.string().min(1, 'R2_ENDPOINT is required'),
  R2_ACCESS_KEY_ID: z.string().min(1, 'R2_ACCESS_KEY_ID is required'),
  R2_SECRET_ACCESS_KEY: z.string().min(1, 'R2_SECRET_ACCESS_KEY is required'),

  // Optional
  CRON_SECRET: z.string().optional(),
  CRON_IP_WHITELIST: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// Validate environment variables at startup
function validateEnv() {
  try {
    const validated = envSchema.safeParse(process.env)

    if (!validated.success) {
      const errors = validated.error.issues
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('\n  ')
      console.error('\n❌ Environment Variable Validation Failed:\n  ' + errors + '\n')
      throw new Error(`Missing or invalid environment variables:\n  ${errors}`)
    }

    console.log('✅ Environment variables validated successfully')
    return validated.data
  } catch (error) {
    console.error('Fatal: Environment validation failed')
    throw error
  }
}

// Validate immediately on import and capture validated env
const env = validateEnv()

const payloadConfig = buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    Post,
    Subscriber,
    Topic,
    Node,
    Brand,
    Tag,
    Product,
    ProductScraper,
    Task,
    AiBlock,
    NodeTopic,
    BrandTopic,
    AbaSearchTerm,
    SearchTermAsinJob,
    AiBlockJob,
  ],
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => {
      // 防御性检查：在 Next.js 热更新期间 defaultFeatures 可能为 undefined
      if (!defaultFeatures || !Array.isArray(defaultFeatures)) {
        return [
          UploadFeature({
            collections: {
              media: {
                fields: [],
              },
            },
          }),
          FixedToolbarFeature(),
          EXPERIMENTAL_TableFeature(),
        ]
      }

      const featuresWithoutDefaultUpload = defaultFeatures.filter(
        (feature) => feature.key !== 'upload',
      )

      return [
        ...featuresWithoutDefaultUpload,
        UploadFeature({
          collections: {
            media: {
              fields: [],
            },
          },
        }),
        FixedToolbarFeature(),
        EXPERIMENTAL_TableFeature(),
      ]
    },
  }),
  secret: env.PAYLOAD_SECRET,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URI,
      // Add statement timeout to prevent long-running queries (5 seconds)
      // This can be overridden per-query if needed
      statement_timeout: 5000,
    },
  }),
  sharp,
  plugins: [
    s3Storage({
      collections: {
        media: {
          generateFileURL: ({ filename }: { filename: string }) => {
            return `${env.R2_PUBLIC_URL}/${filename}`
          },
        },
      },
      bucket: env.R2_BUCKET_NAME,
      config: {
        endpoint: env.R2_ENDPOINT,
        region: 'auto',
        credentials: {
          accessKeyId: env.R2_ACCESS_KEY_ID,
          secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        },
        forcePathStyle: true,
      },
    }),
  ],
})

export default payloadConfig
