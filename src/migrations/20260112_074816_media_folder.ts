import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_media_folder" AS ENUM('posts', 'avatars', 'others');
  ALTER TABLE "media" ADD COLUMN "folder" "enum_media_folder" DEFAULT 'others';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" DROP COLUMN "folder";
  DROP TYPE "public"."enum_media_folder";`)
}
