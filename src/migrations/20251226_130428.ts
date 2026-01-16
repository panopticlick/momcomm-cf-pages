import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "topics_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  ALTER TABLE "users" ADD COLUMN "name" varchar NOT NULL;
  ALTER TABLE "users" ADD COLUMN "slug" varchar NOT NULL;
  ALTER TABLE "users" ADD COLUMN "avatar_id" integer;
  ALTER TABLE "users" ADD COLUMN "job_title" varchar;
  ALTER TABLE "users" ADD COLUMN "bio" varchar;
  ALTER TABLE "users" ADD COLUMN "enable_a_p_i_key" boolean;
  ALTER TABLE "users" ADD COLUMN "api_key" varchar;
  ALTER TABLE "users" ADD COLUMN "api_key_index" varchar;
  ALTER TABLE "topics_rels" ADD CONSTRAINT "topics_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "topics_rels" ADD CONSTRAINT "topics_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "topics_rels_order_idx" ON "topics_rels" USING btree ("order");
  CREATE INDEX "topics_rels_parent_idx" ON "topics_rels" USING btree ("parent_id");
  CREATE INDEX "topics_rels_path_idx" ON "topics_rels" USING btree ("path");
  CREATE INDEX "topics_rels_users_id_idx" ON "topics_rels" USING btree ("users_id");
  ALTER TABLE "users" ADD CONSTRAINT "users_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "users_slug_idx" ON "users" USING btree ("slug");
  CREATE INDEX "users_avatar_idx" ON "users" USING btree ("avatar_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "topics_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "topics_rels" CASCADE;
  ALTER TABLE "users" DROP CONSTRAINT "users_avatar_id_media_id_fk";
  
  DROP INDEX "users_slug_idx";
  DROP INDEX "users_avatar_idx";
  ALTER TABLE "users" DROP COLUMN "name";
  ALTER TABLE "users" DROP COLUMN "slug";
  ALTER TABLE "users" DROP COLUMN "avatar_id";
  ALTER TABLE "users" DROP COLUMN "job_title";
  ALTER TABLE "users" DROP COLUMN "bio";
  ALTER TABLE "users" DROP COLUMN "enable_a_p_i_key";
  ALTER TABLE "users" DROP COLUMN "api_key";
  ALTER TABLE "users" DROP COLUMN "api_key_index";`)
}
