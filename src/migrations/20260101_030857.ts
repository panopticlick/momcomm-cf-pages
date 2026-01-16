import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "brand_topics" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"brand_id" integer NOT NULL,
  	"topic_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "brands" ADD COLUMN "topics_count" numeric DEFAULT 0;
  ALTER TABLE "brands" ADD COLUMN "click_share_sum" numeric DEFAULT 0;
  ALTER TABLE "brands" ADD COLUMN "conversion_share_sum" numeric DEFAULT 0;
  ALTER TABLE "brands" ADD COLUMN "weighted_score_sum" numeric DEFAULT 0;
  ALTER TABLE "products" ADD COLUMN "click_share_sum" numeric DEFAULT 0;
  ALTER TABLE "products" ADD COLUMN "conversion_share_sum" numeric DEFAULT 0;
  ALTER TABLE "products" ADD COLUMN "weighted_score_sum" numeric DEFAULT 0;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "brand_topics_id" integer;
  ALTER TABLE "brand_topics" ADD CONSTRAINT "brand_topics_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "brand_topics" ADD CONSTRAINT "brand_topics_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "brand_topics_brand_idx" ON "brand_topics" USING btree ("brand_id");
  CREATE INDEX "brand_topics_topic_idx" ON "brand_topics" USING btree ("topic_id");
  CREATE INDEX "brand_topics_updated_at_idx" ON "brand_topics" USING btree ("updated_at");
  CREATE INDEX "brand_topics_created_at_idx" ON "brand_topics" USING btree ("created_at");
  CREATE UNIQUE INDEX "brand_topic_idx" ON "brand_topics" USING btree ("brand_id","topic_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brand_topics_fk" FOREIGN KEY ("brand_topics_id") REFERENCES "public"."brand_topics"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_brand_topics_id_idx" ON "payload_locked_documents_rels" USING btree ("brand_topics_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "brand_topics" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "brand_topics" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_brand_topics_fk";
  
  DROP INDEX "payload_locked_documents_rels_brand_topics_id_idx";
  ALTER TABLE "brands" DROP COLUMN "topics_count";
  ALTER TABLE "brands" DROP COLUMN "click_share_sum";
  ALTER TABLE "brands" DROP COLUMN "conversion_share_sum";
  ALTER TABLE "brands" DROP COLUMN "weighted_score_sum";
  ALTER TABLE "products" DROP COLUMN "click_share_sum";
  ALTER TABLE "products" DROP COLUMN "conversion_share_sum";
  ALTER TABLE "products" DROP COLUMN "weighted_score_sum";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "brand_topics_id";`)
}
