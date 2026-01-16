import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Create composite index for aba_search_terms (keywords + asin)
  // This is a hot path for job processor upserts
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "aba_search_terms_keywords_asin_idx"
    ON "aba_search_terms" USING btree ("keywords", "asin");
  `)

  // Create composite index for topics (active + ai_status)
  // Used for filtering topics that need AI processing
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "topics_active_ai_status_idx"
    ON "topics" USING btree ("active", "ai_status");
  `)

  // Create index for products (asin)
  // Used for faster product lookups by ASIN
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "products_asin_idx"
    ON "products" USING btree ("asin");
  `)

  // Create composite index for posts (slug + publishedAt)
  // Used for post lookups and queries
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "posts_slug_published_at_idx"
    ON "posts" USING btree ("slug", "publishedAt");
  `)

  // Create index for posts (publishedAt) for date-based queries
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "posts_published_at_idx"
    ON "posts" USING btree ("publishedAt" DESC);
  `)

  // Create index for search-term-asin-jobs (status + createdAt)
  // Used for job processor queries
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "search_term_asin_jobs_status_created_at_idx"
    ON "search-term-asin-jobs" USING btree ("status", "createdAt");
  `)

  // Create index for ai-blocks (active + type)
  // Used for filtering active AI blocks
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "ai_blocks_active_type_idx"
    ON "ai_blocks" USING btree ("active", "type");
  `)

  console.log('✅ Security indexes created successfully')
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP INDEX IF EXISTS "aba_search_terms_keywords_asin_idx";`)
  await db.execute(sql`DROP INDEX IF EXISTS "topics_active_ai_status_idx";`)
  await db.execute(sql`DROP INDEX IF EXISTS "products_asin_idx";`)
  await db.execute(sql`DROP INDEX IF EXISTS "posts_slug_published_at_idx";`)
  await db.execute(sql`DROP INDEX IF EXISTS "posts_published_at_idx";`)
  await db.execute(sql`DROP INDEX IF EXISTS "search_term_asin_jobs_status_created_at_idx";`)
  await db.execute(sql`DROP INDEX IF EXISTS "ai_blocks_active_type_idx";`)

  console.log('✅ Security indexes dropped successfully')
}
