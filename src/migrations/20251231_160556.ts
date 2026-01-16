import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_topics_ai_status" AS ENUM('PENDING', 'QUEUED', 'METADATA_PROCESSING', 'METADATA_COMPLETED', 'METADATA_ERROR', 'CONTENT_PROCESSING', 'CONTENT_COMPLETED', 'CONTENT_ERROR', 'COMPLETED');
  CREATE TYPE "public"."enum_ai_block_jobs_type" AS ENUM('metadata', 'content');
  CREATE TYPE "public"."enum_ai_block_jobs_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'ERROR');
  CREATE TABLE "brands" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"logo_id" integer,
  	"description" varchar,
  	"asin_count" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ai_blocks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"node_id" integer,
  	"title" varchar NOT NULL,
  	"prompt_metadata" varchar NOT NULL,
  	"prompt_content" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ai_blocks_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "ai_block_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"topic_id" integer NOT NULL,
  	"ai_block_id" integer NOT NULL,
  	"type" "enum_ai_block_jobs_type" NOT NULL,
  	"status" "enum_ai_block_jobs_status" DEFAULT 'PENDING' NOT NULL,
  	"data" jsonb,
  	"message" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "products" ADD COLUMN "brand_id" integer;
  ALTER TABLE "topics" ADD COLUMN "ai_status" "enum_topics_ai_status" DEFAULT 'PENDING' NOT NULL;
  ALTER TABLE "topics" ADD COLUMN "meta_keywords" varchar;
  ALTER TABLE "topics" ADD COLUMN "asin_count" numeric DEFAULT 0;
  ALTER TABLE "topics_rels" ADD COLUMN "tags_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "brands_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ai_blocks_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "ai_block_jobs_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tags_id" integer;
  ALTER TABLE "brands" ADD CONSTRAINT "brands_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ai_blocks" ADD CONSTRAINT "ai_blocks_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ai_blocks_rels" ADD CONSTRAINT "ai_blocks_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ai_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ai_blocks_rels" ADD CONSTRAINT "ai_blocks_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ai_block_jobs" ADD CONSTRAINT "ai_block_jobs_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ai_block_jobs" ADD CONSTRAINT "ai_block_jobs_ai_block_id_ai_blocks_id_fk" FOREIGN KEY ("ai_block_id") REFERENCES "public"."ai_blocks"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "brands_name_idx" ON "brands" USING btree ("name");
  CREATE UNIQUE INDEX "brands_slug_idx" ON "brands" USING btree ("slug");
  CREATE INDEX "brands_logo_idx" ON "brands" USING btree ("logo_id");
  CREATE INDEX "brands_updated_at_idx" ON "brands" USING btree ("updated_at");
  CREATE INDEX "brands_created_at_idx" ON "brands" USING btree ("created_at");
  CREATE INDEX "ai_blocks_node_idx" ON "ai_blocks" USING btree ("node_id");
  CREATE INDEX "ai_blocks_updated_at_idx" ON "ai_blocks" USING btree ("updated_at");
  CREATE INDEX "ai_blocks_created_at_idx" ON "ai_blocks" USING btree ("created_at");
  CREATE INDEX "ai_blocks_rels_order_idx" ON "ai_blocks_rels" USING btree ("order");
  CREATE INDEX "ai_blocks_rels_parent_idx" ON "ai_blocks_rels" USING btree ("parent_id");
  CREATE INDEX "ai_blocks_rels_path_idx" ON "ai_blocks_rels" USING btree ("path");
  CREATE INDEX "ai_blocks_rels_users_id_idx" ON "ai_blocks_rels" USING btree ("users_id");
  CREATE INDEX "ai_block_jobs_topic_idx" ON "ai_block_jobs" USING btree ("topic_id");
  CREATE INDEX "ai_block_jobs_ai_block_idx" ON "ai_block_jobs" USING btree ("ai_block_id");
  CREATE INDEX "ai_block_jobs_type_idx" ON "ai_block_jobs" USING btree ("type");
  CREATE INDEX "ai_block_jobs_status_idx" ON "ai_block_jobs" USING btree ("status");
  CREATE INDEX "ai_block_jobs_updated_at_idx" ON "ai_block_jobs" USING btree ("updated_at");
  CREATE INDEX "ai_block_jobs_created_at_idx" ON "ai_block_jobs" USING btree ("created_at");
  CREATE UNIQUE INDEX "topic_type_idx" ON "ai_block_jobs" USING btree ("topic_id","type");
  CREATE UNIQUE INDEX "tags_name_idx" ON "tags" USING btree ("name");
  CREATE UNIQUE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");
  CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");
  ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "topics_rels" ADD CONSTRAINT "topics_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ai_blocks_fk" FOREIGN KEY ("ai_blocks_id") REFERENCES "public"."ai_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ai_block_jobs_fk" FOREIGN KEY ("ai_block_jobs_id") REFERENCES "public"."ai_block_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_brand_idx" ON "products" USING btree ("brand_id");
  CREATE INDEX "topics_ai_status_idx" ON "topics" USING btree ("ai_status");
  CREATE INDEX "topics_asin_count_idx" ON "topics" USING btree ("asin_count");
  CREATE INDEX "topics_rels_tags_id_idx" ON "topics_rels" USING btree ("tags_id");
  CREATE INDEX "payload_locked_documents_rels_brands_id_idx" ON "payload_locked_documents_rels" USING btree ("brands_id");
  CREATE INDEX "payload_locked_documents_rels_ai_blocks_id_idx" ON "payload_locked_documents_rels" USING btree ("ai_blocks_id");
  CREATE INDEX "payload_locked_documents_rels_ai_block_jobs_id_idx" ON "payload_locked_documents_rels" USING btree ("ai_block_jobs_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "brands" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ai_blocks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ai_blocks_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ai_block_jobs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tags" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "brands" CASCADE;
  DROP TABLE "ai_blocks" CASCADE;
  DROP TABLE "ai_blocks_rels" CASCADE;
  DROP TABLE "ai_block_jobs" CASCADE;
  DROP TABLE "tags" CASCADE;
  ALTER TABLE "products" DROP CONSTRAINT "products_brand_id_brands_id_fk";
  
  ALTER TABLE "topics_rels" DROP CONSTRAINT "topics_rels_tags_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_brands_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ai_blocks_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_ai_block_jobs_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tags_fk";
  
  DROP INDEX "products_brand_idx";
  DROP INDEX "topics_ai_status_idx";
  DROP INDEX "topics_asin_count_idx";
  DROP INDEX "topics_rels_tags_id_idx";
  DROP INDEX "payload_locked_documents_rels_brands_id_idx";
  DROP INDEX "payload_locked_documents_rels_ai_blocks_id_idx";
  DROP INDEX "payload_locked_documents_rels_ai_block_jobs_id_idx";
  DROP INDEX "payload_locked_documents_rels_tags_id_idx";
  ALTER TABLE "products" DROP COLUMN "brand_id";
  ALTER TABLE "topics" DROP COLUMN "ai_status";
  ALTER TABLE "topics" DROP COLUMN "meta_keywords";
  ALTER TABLE "topics" DROP COLUMN "asin_count";
  ALTER TABLE "topics_rels" DROP COLUMN "tags_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "brands_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ai_blocks_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "ai_block_jobs_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tags_id";
  DROP TYPE "public"."enum_topics_ai_status";
  DROP TYPE "public"."enum_ai_block_jobs_type";
  DROP TYPE "public"."enum_ai_block_jobs_status";`)
}
