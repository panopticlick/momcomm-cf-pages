import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_tasks_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'ERROR');
  CREATE TYPE "public"."enum_products_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'ERROR', 'NOT_FOUND');
  CREATE TYPE "public"."enum_product_scrapers_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'ERROR', 'NOT_FOUND');
  CREATE TYPE "public"."enum_search_term_asin_jobs_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'ERROR');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "aba_search_terms" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"keywords" varchar NOT NULL,
  	"asin" varchar NOT NULL,
  	"node_ids" jsonb,
  	"occurrences" numeric,
  	"search_rank" numeric,
  	"conversion_share" numeric,
  	"click_share" numeric,
  	"weighted_score" numeric,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tasks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"keywords" varchar NOT NULL,
  	"node_ids" jsonb,
  	"status" "enum_tasks_status" DEFAULT 'PENDING' NOT NULL,
  	"message" varchar,
  	"metadata" varchar,
  	"completed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "nodes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"node_id" varchar NOT NULL,
  	"display_name" varchar NOT NULL,
  	"context_free_name" varchar NOT NULL,
  	"parent" varchar,
  	"is_root" boolean,
  	"slug" varchar NOT NULL,
  	"topics_count" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "products" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"asin" varchar NOT NULL,
  	"active" boolean DEFAULT true,
  	"image" varchar,
  	"paapi5" jsonb,
  	"status" "enum_products_status" DEFAULT 'PENDING' NOT NULL,
  	"message" varchar,
  	"completed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "product_scrapers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"asin" varchar NOT NULL,
  	"active" boolean DEFAULT true,
  	"scraper_metadata" jsonb,
  	"status" "enum_product_scrapers_status" DEFAULT 'PENDING' NOT NULL,
  	"message" varchar,
  	"completed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "topics" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"display_name" varchar,
  	"slug" varchar NOT NULL,
  	"active" boolean DEFAULT false,
  	"conversion_share_sum" numeric,
  	"click_share_sum" numeric,
  	"weighted_score_sum" numeric,
  	"alias" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"content" jsonb,
  	"nodes_count" numeric DEFAULT 0,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "node_topics" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"node_id" integer NOT NULL,
  	"topic_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "search_term_asin_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"task_id" integer NOT NULL,
  	"keywords" varchar NOT NULL,
  	"node_ids" jsonb,
  	"offset" numeric NOT NULL,
  	"limit" numeric DEFAULT 1000 NOT NULL,
  	"total" numeric,
  	"status" "enum_search_term_asin_jobs_status" DEFAULT 'PENDING' NOT NULL,
  	"body" jsonb,
  	"message" varchar,
  	"completed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"aba_search_terms_id" integer,
  	"tasks_id" integer,
  	"nodes_id" integer,
  	"products_id" integer,
  	"product_scrapers_id" integer,
  	"topics_id" integer,
  	"node_topics_id" integer,
  	"search_term_asin_jobs_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "node_topics" ADD CONSTRAINT "node_topics_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "node_topics" ADD CONSTRAINT "node_topics_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "search_term_asin_jobs" ADD CONSTRAINT "search_term_asin_jobs_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_aba_search_terms_fk" FOREIGN KEY ("aba_search_terms_id") REFERENCES "public"."aba_search_terms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tasks_fk" FOREIGN KEY ("tasks_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_nodes_fk" FOREIGN KEY ("nodes_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_products_fk" FOREIGN KEY ("products_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_product_scrapers_fk" FOREIGN KEY ("product_scrapers_id") REFERENCES "public"."product_scrapers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_topics_fk" FOREIGN KEY ("topics_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_node_topics_fk" FOREIGN KEY ("node_topics_id") REFERENCES "public"."node_topics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_search_term_asin_jobs_fk" FOREIGN KEY ("search_term_asin_jobs_id") REFERENCES "public"."search_term_asin_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "aba_search_terms_keywords_idx" ON "aba_search_terms" USING btree ("keywords");
  CREATE INDEX "aba_search_terms_asin_idx" ON "aba_search_terms" USING btree ("asin");
  CREATE INDEX "aba_search_terms_updated_at_idx" ON "aba_search_terms" USING btree ("updated_at");
  CREATE INDEX "aba_search_terms_created_at_idx" ON "aba_search_terms" USING btree ("created_at");
  CREATE UNIQUE INDEX "keywords_asin_idx" ON "aba_search_terms" USING btree ("keywords","asin");
  CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");
  CREATE INDEX "tasks_completed_at_idx" ON "tasks" USING btree ("completed_at");
  CREATE INDEX "tasks_updated_at_idx" ON "tasks" USING btree ("updated_at");
  CREATE INDEX "tasks_created_at_idx" ON "tasks" USING btree ("created_at");
  CREATE UNIQUE INDEX "keywords_idx" ON "tasks" USING btree ("keywords");
  CREATE UNIQUE INDEX "nodes_node_id_idx" ON "nodes" USING btree ("node_id");
  CREATE INDEX "nodes_parent_idx" ON "nodes" USING btree ("parent");
  CREATE INDEX "nodes_slug_idx" ON "nodes" USING btree ("slug");
  CREATE INDEX "nodes_topics_count_idx" ON "nodes" USING btree ("topics_count");
  CREATE INDEX "nodes_updated_at_idx" ON "nodes" USING btree ("updated_at");
  CREATE INDEX "nodes_created_at_idx" ON "nodes" USING btree ("created_at");
  CREATE UNIQUE INDEX "products_asin_idx" ON "products" USING btree ("asin");
  CREATE INDEX "products_active_idx" ON "products" USING btree ("active");
  CREATE INDEX "products_status_idx" ON "products" USING btree ("status");
  CREATE INDEX "products_updated_at_idx" ON "products" USING btree ("updated_at");
  CREATE INDEX "products_created_at_idx" ON "products" USING btree ("created_at");
  CREATE UNIQUE INDEX "product_scrapers_asin_idx" ON "product_scrapers" USING btree ("asin");
  CREATE INDEX "product_scrapers_active_idx" ON "product_scrapers" USING btree ("active");
  CREATE INDEX "product_scrapers_status_idx" ON "product_scrapers" USING btree ("status");
  CREATE INDEX "product_scrapers_updated_at_idx" ON "product_scrapers" USING btree ("updated_at");
  CREATE INDEX "product_scrapers_created_at_idx" ON "product_scrapers" USING btree ("created_at");
  CREATE UNIQUE INDEX "topics_name_idx" ON "topics" USING btree ("name");
  CREATE UNIQUE INDEX "topics_slug_idx" ON "topics" USING btree ("slug");
  CREATE INDEX "topics_active_idx" ON "topics" USING btree ("active");
  CREATE INDEX "topics_conversion_share_sum_idx" ON "topics" USING btree ("conversion_share_sum");
  CREATE INDEX "topics_click_share_sum_idx" ON "topics" USING btree ("click_share_sum");
  CREATE INDEX "topics_weighted_score_sum_idx" ON "topics" USING btree ("weighted_score_sum");
  CREATE INDEX "topics_nodes_count_idx" ON "topics" USING btree ("nodes_count");
  CREATE INDEX "topics_updated_at_idx" ON "topics" USING btree ("updated_at");
  CREATE INDEX "topics_created_at_idx" ON "topics" USING btree ("created_at");
  CREATE INDEX "node_topics_node_idx" ON "node_topics" USING btree ("node_id");
  CREATE INDEX "node_topics_topic_idx" ON "node_topics" USING btree ("topic_id");
  CREATE INDEX "node_topics_updated_at_idx" ON "node_topics" USING btree ("updated_at");
  CREATE INDEX "node_topics_created_at_idx" ON "node_topics" USING btree ("created_at");
  CREATE UNIQUE INDEX "node_topic_idx" ON "node_topics" USING btree ("node_id","topic_id");
  CREATE INDEX "search_term_asin_jobs_task_idx" ON "search_term_asin_jobs" USING btree ("task_id");
  CREATE INDEX "search_term_asin_jobs_keywords_idx" ON "search_term_asin_jobs" USING btree ("keywords");
  CREATE INDEX "search_term_asin_jobs_status_idx" ON "search_term_asin_jobs" USING btree ("status");
  CREATE INDEX "search_term_asin_jobs_completed_at_idx" ON "search_term_asin_jobs" USING btree ("completed_at");
  CREATE INDEX "search_term_asin_jobs_updated_at_idx" ON "search_term_asin_jobs" USING btree ("updated_at");
  CREATE INDEX "search_term_asin_jobs_created_at_idx" ON "search_term_asin_jobs" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_aba_search_terms_id_idx" ON "payload_locked_documents_rels" USING btree ("aba_search_terms_id");
  CREATE INDEX "payload_locked_documents_rels_tasks_id_idx" ON "payload_locked_documents_rels" USING btree ("tasks_id");
  CREATE INDEX "payload_locked_documents_rels_nodes_id_idx" ON "payload_locked_documents_rels" USING btree ("nodes_id");
  CREATE INDEX "payload_locked_documents_rels_products_id_idx" ON "payload_locked_documents_rels" USING btree ("products_id");
  CREATE INDEX "payload_locked_documents_rels_product_scrapers_id_idx" ON "payload_locked_documents_rels" USING btree ("product_scrapers_id");
  CREATE INDEX "payload_locked_documents_rels_topics_id_idx" ON "payload_locked_documents_rels" USING btree ("topics_id");
  CREATE INDEX "payload_locked_documents_rels_node_topics_id_idx" ON "payload_locked_documents_rels" USING btree ("node_topics_id");
  CREATE INDEX "payload_locked_documents_rels_search_term_asin_jobs_id_idx" ON "payload_locked_documents_rels" USING btree ("search_term_asin_jobs_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "aba_search_terms" CASCADE;
  DROP TABLE "tasks" CASCADE;
  DROP TABLE "nodes" CASCADE;
  DROP TABLE "products" CASCADE;
  DROP TABLE "product_scrapers" CASCADE;
  DROP TABLE "topics" CASCADE;
  DROP TABLE "node_topics" CASCADE;
  DROP TABLE "search_term_asin_jobs" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_tasks_status";
  DROP TYPE "public"."enum_products_status";
  DROP TYPE "public"."enum_product_scrapers_status";
  DROP TYPE "public"."enum_search_term_asin_jobs_status";`)
}
