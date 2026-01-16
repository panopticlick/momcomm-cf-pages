import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "topics" ADD COLUMN "redirect" boolean DEFAULT false;
  ALTER TABLE "topics" ADD COLUMN "redirect_to" varchar;
  CREATE INDEX "topics_redirect_idx" ON "topics" USING btree ("redirect");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "topics_redirect_idx";
  ALTER TABLE "topics" DROP COLUMN "redirect";
  ALTER TABLE "topics" DROP COLUMN "redirect_to";`)
}
