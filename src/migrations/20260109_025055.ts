import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_posts_ai_status" AS ENUM('pending', 'processing_content', 'processing_media', 'content_completed', 'media_completed', 'completed');
  ALTER TABLE "posts" ADD COLUMN "ai_status" "enum_posts_ai_status" DEFAULT 'pending';
  CREATE INDEX "posts_ai_status_idx" ON "posts" USING btree ("ai_status");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "posts_ai_status_idx";
  ALTER TABLE "posts" DROP COLUMN "ai_status";
  DROP TYPE "public"."enum_posts_ai_status";`)
}
