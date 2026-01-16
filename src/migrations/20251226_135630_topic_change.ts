import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "topics" ADD COLUMN "excerpt" varchar;
  ALTER TABLE "topics" ADD COLUMN "featured_media_id" integer;
  ALTER TABLE "topics" ADD COLUMN "introductory" jsonb;
  ALTER TABLE "topics" ADD CONSTRAINT "topics_featured_media_id_media_id_fk" FOREIGN KEY ("featured_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "topics_featured_media_idx" ON "topics" USING btree ("featured_media_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "topics" DROP CONSTRAINT "topics_featured_media_id_media_id_fk";
  
  DROP INDEX "topics_featured_media_idx";
  ALTER TABLE "topics" DROP COLUMN "excerpt";
  ALTER TABLE "topics" DROP COLUMN "featured_media_id";
  ALTER TABLE "topics" DROP COLUMN "introductory";`)
}
