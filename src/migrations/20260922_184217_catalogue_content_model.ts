import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('en', 'nl');
  CREATE TYPE "public"."enum_items_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__items_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__items_v_published_locale" AS ENUM('en', 'nl');
  CREATE TYPE "public"."enum_categories_catalogue" AS ENUM('cakes', 'nibbles');
  CREATE TYPE "public"."enum_payload_folders_folder_type" AS ENUM('media');
  CREATE TYPE "public"."enum_cross_contamination_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__cross_contamination_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__cross_contamination_v_published_locale" AS ENUM('en', 'nl');
  CREATE TYPE "public"."enum_lead_time_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__lead_time_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__lead_time_v_published_locale" AS ENUM('en', 'nl');
  CREATE TYPE "public"."enum_closed_until_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__closed_until_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__closed_until_v_published_locale" AS ENUM('en', 'nl');
  CREATE TABLE "items_sizes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"diameter" numeric,
  	"layers" numeric,
  	"servings" numeric,
  	"price" numeric
  );
  
  CREATE TABLE "items_sizes_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "items" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"category_id" integer,
  	"configurable" boolean DEFAULT false,
  	"lead_time_days" numeric,
  	"lead_time_time_of_day" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_items_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "items_locales" (
  	"title" varchar,
  	"slug" varchar,
  	"description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "items_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"occasions_id" integer,
  	"media_id" integer,
  	"sponges_id" integer,
  	"fillings_id" integer,
  	"allergens_id" integer
  );
  
  CREATE TABLE "_items_v_version_sizes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"diameter" numeric,
  	"layers" numeric,
  	"servings" numeric,
  	"price" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_items_v_version_sizes_locales" (
  	"label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_items_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_category_id" integer,
  	"version_configurable" boolean DEFAULT false,
  	"version_lead_time_days" numeric,
  	"version_lead_time_time_of_day" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__items_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__items_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_items_v_locales" (
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_description" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_items_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"occasions_id" integer,
  	"media_id" integer,
  	"sponges_id" integer,
  	"fillings_id" integer,
  	"allergens_id" integer
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"catalogue" "enum_categories_catalogue" NOT NULL,
  	"order" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "categories_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "occasions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "occasions_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "sponges" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "sponges_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "fillings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"surcharge" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "fillings_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "allergens" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "allergens_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"caption" jsonb,
  	"folder_id" integer,
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
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_square_url" varchar,
  	"sizes_square_width" numeric,
  	"sizes_square_height" numeric,
  	"sizes_square_mime_type" varchar,
  	"sizes_square_filesize" numeric,
  	"sizes_square_filename" varchar,
  	"sizes_small_url" varchar,
  	"sizes_small_width" numeric,
  	"sizes_small_height" numeric,
  	"sizes_small_mime_type" varchar,
  	"sizes_small_filesize" numeric,
  	"sizes_small_filename" varchar,
  	"sizes_medium_url" varchar,
  	"sizes_medium_width" numeric,
  	"sizes_medium_height" numeric,
  	"sizes_medium_mime_type" varchar,
  	"sizes_medium_filesize" numeric,
  	"sizes_medium_filename" varchar,
  	"sizes_large_url" varchar,
  	"sizes_large_width" numeric,
  	"sizes_large_height" numeric,
  	"sizes_large_mime_type" varchar,
  	"sizes_large_filesize" numeric,
  	"sizes_large_filename" varchar,
  	"sizes_xlarge_url" varchar,
  	"sizes_xlarge_width" numeric,
  	"sizes_xlarge_height" numeric,
  	"sizes_xlarge_mime_type" varchar,
  	"sizes_xlarge_filesize" numeric,
  	"sizes_xlarge_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  CREATE TABLE "payload_folders_folder_type" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_payload_folders_folder_type",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload_folders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"folder_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cross_contamination" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_status" "enum_cross_contamination_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "cross_contamination_locales" (
  	"statement" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_cross_contamination_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version__status" "enum__cross_contamination_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__cross_contamination_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_cross_contamination_v_locales" (
  	"version_statement" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "lead_time" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"days" numeric DEFAULT 3,
  	"time_of_day" varchar DEFAULT '17:00',
  	"_status" "enum_lead_time_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "_lead_time_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_days" numeric DEFAULT 3,
  	"version_time_of_day" varchar DEFAULT '17:00',
  	"version__status" "enum__lead_time_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__lead_time_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "closed_until" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"date" timestamp(3) with time zone,
  	"_status" "enum_closed_until_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "closed_until_locales" (
  	"notice" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_closed_until_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_date" timestamp(3) with time zone,
  	"version__status" "enum__closed_until_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__closed_until_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_closed_until_v_locales" (
  	"version_notice" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "items_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "categories_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "occasions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "sponges_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "fillings_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "allergens_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "media_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "payload_folders_id" integer;
  ALTER TABLE "items_sizes" ADD CONSTRAINT "items_sizes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "items_sizes_locales" ADD CONSTRAINT "items_sizes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."items_sizes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "items" ADD CONSTRAINT "items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "items_locales" ADD CONSTRAINT "items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "items_rels" ADD CONSTRAINT "items_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "items_rels" ADD CONSTRAINT "items_rels_occasions_fk" FOREIGN KEY ("occasions_id") REFERENCES "public"."occasions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "items_rels" ADD CONSTRAINT "items_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "items_rels" ADD CONSTRAINT "items_rels_sponges_fk" FOREIGN KEY ("sponges_id") REFERENCES "public"."sponges"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "items_rels" ADD CONSTRAINT "items_rels_fillings_fk" FOREIGN KEY ("fillings_id") REFERENCES "public"."fillings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "items_rels" ADD CONSTRAINT "items_rels_allergens_fk" FOREIGN KEY ("allergens_id") REFERENCES "public"."allergens"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_items_v_version_sizes" ADD CONSTRAINT "_items_v_version_sizes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_items_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_items_v_version_sizes_locales" ADD CONSTRAINT "_items_v_version_sizes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_items_v_version_sizes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_items_v" ADD CONSTRAINT "_items_v_parent_id_items_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."items"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_items_v" ADD CONSTRAINT "_items_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_items_v_locales" ADD CONSTRAINT "_items_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_items_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_items_v_rels" ADD CONSTRAINT "_items_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_items_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_items_v_rels" ADD CONSTRAINT "_items_v_rels_occasions_fk" FOREIGN KEY ("occasions_id") REFERENCES "public"."occasions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_items_v_rels" ADD CONSTRAINT "_items_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_items_v_rels" ADD CONSTRAINT "_items_v_rels_sponges_fk" FOREIGN KEY ("sponges_id") REFERENCES "public"."sponges"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_items_v_rels" ADD CONSTRAINT "_items_v_rels_fillings_fk" FOREIGN KEY ("fillings_id") REFERENCES "public"."fillings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_items_v_rels" ADD CONSTRAINT "_items_v_rels_allergens_fk" FOREIGN KEY ("allergens_id") REFERENCES "public"."allergens"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories_locales" ADD CONSTRAINT "categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "occasions_locales" ADD CONSTRAINT "occasions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."occasions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sponges_locales" ADD CONSTRAINT "sponges_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sponges"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "fillings_locales" ADD CONSTRAINT "fillings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fillings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "allergens" ADD CONSTRAINT "allergens_icon_id_media_id_fk" FOREIGN KEY ("icon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "allergens_locales" ADD CONSTRAINT "allergens_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."allergens"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_folders_folder_type" ADD CONSTRAINT "payload_folders_folder_type_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_folders" ADD CONSTRAINT "payload_folders_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cross_contamination_locales" ADD CONSTRAINT "cross_contamination_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cross_contamination"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_cross_contamination_v_locales" ADD CONSTRAINT "_cross_contamination_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_cross_contamination_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "closed_until_locales" ADD CONSTRAINT "closed_until_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."closed_until"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_closed_until_v_locales" ADD CONSTRAINT "_closed_until_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_closed_until_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "items_sizes_order_idx" ON "items_sizes" USING btree ("_order");
  CREATE INDEX "items_sizes_parent_id_idx" ON "items_sizes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "items_sizes_locales_locale_parent_id_unique" ON "items_sizes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "items_category_idx" ON "items" USING btree ("category_id");
  CREATE INDEX "items_updated_at_idx" ON "items" USING btree ("updated_at");
  CREATE INDEX "items_created_at_idx" ON "items" USING btree ("created_at");
  CREATE INDEX "items__status_idx" ON "items" USING btree ("_status");
  CREATE UNIQUE INDEX "items_slug_idx" ON "items_locales" USING btree ("slug","_locale");
  CREATE UNIQUE INDEX "items_locales_locale_parent_id_unique" ON "items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "items_rels_order_idx" ON "items_rels" USING btree ("order");
  CREATE INDEX "items_rels_parent_idx" ON "items_rels" USING btree ("parent_id");
  CREATE INDEX "items_rels_path_idx" ON "items_rels" USING btree ("path");
  CREATE INDEX "items_rels_occasions_id_idx" ON "items_rels" USING btree ("occasions_id");
  CREATE INDEX "items_rels_media_id_idx" ON "items_rels" USING btree ("media_id");
  CREATE INDEX "items_rels_sponges_id_idx" ON "items_rels" USING btree ("sponges_id");
  CREATE INDEX "items_rels_fillings_id_idx" ON "items_rels" USING btree ("fillings_id");
  CREATE INDEX "items_rels_allergens_id_idx" ON "items_rels" USING btree ("allergens_id");
  CREATE INDEX "_items_v_version_sizes_order_idx" ON "_items_v_version_sizes" USING btree ("_order");
  CREATE INDEX "_items_v_version_sizes_parent_id_idx" ON "_items_v_version_sizes" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_items_v_version_sizes_locales_locale_parent_id_unique" ON "_items_v_version_sizes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_items_v_parent_idx" ON "_items_v" USING btree ("parent_id");
  CREATE INDEX "_items_v_version_version_category_idx" ON "_items_v" USING btree ("version_category_id");
  CREATE INDEX "_items_v_version_version_updated_at_idx" ON "_items_v" USING btree ("version_updated_at");
  CREATE INDEX "_items_v_version_version_created_at_idx" ON "_items_v" USING btree ("version_created_at");
  CREATE INDEX "_items_v_version_version__status_idx" ON "_items_v" USING btree ("version__status");
  CREATE INDEX "_items_v_created_at_idx" ON "_items_v" USING btree ("created_at");
  CREATE INDEX "_items_v_updated_at_idx" ON "_items_v" USING btree ("updated_at");
  CREATE INDEX "_items_v_snapshot_idx" ON "_items_v" USING btree ("snapshot");
  CREATE INDEX "_items_v_published_locale_idx" ON "_items_v" USING btree ("published_locale");
  CREATE INDEX "_items_v_latest_idx" ON "_items_v" USING btree ("latest");
  CREATE INDEX "_items_v_autosave_idx" ON "_items_v" USING btree ("autosave");
  CREATE INDEX "_items_v_version_version_slug_idx" ON "_items_v_locales" USING btree ("version_slug","_locale");
  CREATE UNIQUE INDEX "_items_v_locales_locale_parent_id_unique" ON "_items_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_items_v_rels_order_idx" ON "_items_v_rels" USING btree ("order");
  CREATE INDEX "_items_v_rels_parent_idx" ON "_items_v_rels" USING btree ("parent_id");
  CREATE INDEX "_items_v_rels_path_idx" ON "_items_v_rels" USING btree ("path");
  CREATE INDEX "_items_v_rels_occasions_id_idx" ON "_items_v_rels" USING btree ("occasions_id");
  CREATE INDEX "_items_v_rels_media_id_idx" ON "_items_v_rels" USING btree ("media_id");
  CREATE INDEX "_items_v_rels_sponges_id_idx" ON "_items_v_rels" USING btree ("sponges_id");
  CREATE INDEX "_items_v_rels_fillings_id_idx" ON "_items_v_rels" USING btree ("fillings_id");
  CREATE INDEX "_items_v_rels_allergens_id_idx" ON "_items_v_rels" USING btree ("allergens_id");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "categories_locales_locale_parent_id_unique" ON "categories_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "occasions_updated_at_idx" ON "occasions" USING btree ("updated_at");
  CREATE INDEX "occasions_created_at_idx" ON "occasions" USING btree ("created_at");
  CREATE UNIQUE INDEX "occasions_locales_locale_parent_id_unique" ON "occasions_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "sponges_updated_at_idx" ON "sponges" USING btree ("updated_at");
  CREATE INDEX "sponges_created_at_idx" ON "sponges" USING btree ("created_at");
  CREATE UNIQUE INDEX "sponges_locales_locale_parent_id_unique" ON "sponges_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "fillings_updated_at_idx" ON "fillings" USING btree ("updated_at");
  CREATE INDEX "fillings_created_at_idx" ON "fillings" USING btree ("created_at");
  CREATE UNIQUE INDEX "fillings_locales_locale_parent_id_unique" ON "fillings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "allergens_icon_idx" ON "allergens" USING btree ("icon_id");
  CREATE INDEX "allergens_updated_at_idx" ON "allergens" USING btree ("updated_at");
  CREATE INDEX "allergens_created_at_idx" ON "allergens" USING btree ("created_at");
  CREATE UNIQUE INDEX "allergens_locales_locale_parent_id_unique" ON "allergens_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "media_folder_idx" ON "media" USING btree ("folder_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_square_sizes_square_filename_idx" ON "media" USING btree ("sizes_square_filename");
  CREATE INDEX "media_sizes_small_sizes_small_filename_idx" ON "media" USING btree ("sizes_small_filename");
  CREATE INDEX "media_sizes_medium_sizes_medium_filename_idx" ON "media" USING btree ("sizes_medium_filename");
  CREATE INDEX "media_sizes_large_sizes_large_filename_idx" ON "media" USING btree ("sizes_large_filename");
  CREATE INDEX "media_sizes_xlarge_sizes_xlarge_filename_idx" ON "media" USING btree ("sizes_xlarge_filename");
  CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "media" USING btree ("sizes_og_filename");
  CREATE INDEX "payload_folders_folder_type_order_idx" ON "payload_folders_folder_type" USING btree ("order");
  CREATE INDEX "payload_folders_folder_type_parent_idx" ON "payload_folders_folder_type" USING btree ("parent_id");
  CREATE INDEX "payload_folders_name_idx" ON "payload_folders" USING btree ("name");
  CREATE INDEX "payload_folders_folder_idx" ON "payload_folders" USING btree ("folder_id");
  CREATE INDEX "payload_folders_updated_at_idx" ON "payload_folders" USING btree ("updated_at");
  CREATE INDEX "payload_folders_created_at_idx" ON "payload_folders" USING btree ("created_at");
  CREATE INDEX "cross_contamination__status_idx" ON "cross_contamination" USING btree ("_status");
  CREATE UNIQUE INDEX "cross_contamination_locales_locale_parent_id_unique" ON "cross_contamination_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_cross_contamination_v_version_version__status_idx" ON "_cross_contamination_v" USING btree ("version__status");
  CREATE INDEX "_cross_contamination_v_created_at_idx" ON "_cross_contamination_v" USING btree ("created_at");
  CREATE INDEX "_cross_contamination_v_updated_at_idx" ON "_cross_contamination_v" USING btree ("updated_at");
  CREATE INDEX "_cross_contamination_v_snapshot_idx" ON "_cross_contamination_v" USING btree ("snapshot");
  CREATE INDEX "_cross_contamination_v_published_locale_idx" ON "_cross_contamination_v" USING btree ("published_locale");
  CREATE INDEX "_cross_contamination_v_latest_idx" ON "_cross_contamination_v" USING btree ("latest");
  CREATE INDEX "_cross_contamination_v_autosave_idx" ON "_cross_contamination_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_cross_contamination_v_locales_locale_parent_id_unique" ON "_cross_contamination_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "lead_time__status_idx" ON "lead_time" USING btree ("_status");
  CREATE INDEX "_lead_time_v_version_version__status_idx" ON "_lead_time_v" USING btree ("version__status");
  CREATE INDEX "_lead_time_v_created_at_idx" ON "_lead_time_v" USING btree ("created_at");
  CREATE INDEX "_lead_time_v_updated_at_idx" ON "_lead_time_v" USING btree ("updated_at");
  CREATE INDEX "_lead_time_v_snapshot_idx" ON "_lead_time_v" USING btree ("snapshot");
  CREATE INDEX "_lead_time_v_published_locale_idx" ON "_lead_time_v" USING btree ("published_locale");
  CREATE INDEX "_lead_time_v_latest_idx" ON "_lead_time_v" USING btree ("latest");
  CREATE INDEX "_lead_time_v_autosave_idx" ON "_lead_time_v" USING btree ("autosave");
  CREATE INDEX "closed_until__status_idx" ON "closed_until" USING btree ("_status");
  CREATE UNIQUE INDEX "closed_until_locales_locale_parent_id_unique" ON "closed_until_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_closed_until_v_version_version__status_idx" ON "_closed_until_v" USING btree ("version__status");
  CREATE INDEX "_closed_until_v_created_at_idx" ON "_closed_until_v" USING btree ("created_at");
  CREATE INDEX "_closed_until_v_updated_at_idx" ON "_closed_until_v" USING btree ("updated_at");
  CREATE INDEX "_closed_until_v_snapshot_idx" ON "_closed_until_v" USING btree ("snapshot");
  CREATE INDEX "_closed_until_v_published_locale_idx" ON "_closed_until_v" USING btree ("published_locale");
  CREATE INDEX "_closed_until_v_latest_idx" ON "_closed_until_v" USING btree ("latest");
  CREATE INDEX "_closed_until_v_autosave_idx" ON "_closed_until_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_closed_until_v_locales_locale_parent_id_unique" ON "_closed_until_v_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_items_fk" FOREIGN KEY ("items_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_occasions_fk" FOREIGN KEY ("occasions_id") REFERENCES "public"."occasions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sponges_fk" FOREIGN KEY ("sponges_id") REFERENCES "public"."sponges"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_fillings_fk" FOREIGN KEY ("fillings_id") REFERENCES "public"."fillings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_allergens_fk" FOREIGN KEY ("allergens_id") REFERENCES "public"."allergens"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_folders_fk" FOREIGN KEY ("payload_folders_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_items_id_idx" ON "payload_locked_documents_rels" USING btree ("items_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_occasions_id_idx" ON "payload_locked_documents_rels" USING btree ("occasions_id");
  CREATE INDEX "payload_locked_documents_rels_sponges_id_idx" ON "payload_locked_documents_rels" USING btree ("sponges_id");
  CREATE INDEX "payload_locked_documents_rels_fillings_id_idx" ON "payload_locked_documents_rels" USING btree ("fillings_id");
  CREATE INDEX "payload_locked_documents_rels_allergens_id_idx" ON "payload_locked_documents_rels" USING btree ("allergens_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_payload_folders_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_folders_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "items_sizes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "items_sizes_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "items_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_items_v_version_sizes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_items_v_version_sizes_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_items_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_items_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_items_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "categories_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "occasions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "occasions_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sponges" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sponges_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "fillings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "fillings_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "allergens" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "allergens_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "media" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_folders_folder_type" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_folders" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cross_contamination" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cross_contamination_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cross_contamination_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_cross_contamination_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "lead_time" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_lead_time_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "closed_until" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "closed_until_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_closed_until_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_closed_until_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "items_sizes" CASCADE;
  DROP TABLE "items_sizes_locales" CASCADE;
  DROP TABLE "items" CASCADE;
  DROP TABLE "items_locales" CASCADE;
  DROP TABLE "items_rels" CASCADE;
  DROP TABLE "_items_v_version_sizes" CASCADE;
  DROP TABLE "_items_v_version_sizes_locales" CASCADE;
  DROP TABLE "_items_v" CASCADE;
  DROP TABLE "_items_v_locales" CASCADE;
  DROP TABLE "_items_v_rels" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "categories_locales" CASCADE;
  DROP TABLE "occasions" CASCADE;
  DROP TABLE "occasions_locales" CASCADE;
  DROP TABLE "sponges" CASCADE;
  DROP TABLE "sponges_locales" CASCADE;
  DROP TABLE "fillings" CASCADE;
  DROP TABLE "fillings_locales" CASCADE;
  DROP TABLE "allergens" CASCADE;
  DROP TABLE "allergens_locales" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "payload_folders_folder_type" CASCADE;
  DROP TABLE "payload_folders" CASCADE;
  DROP TABLE "cross_contamination" CASCADE;
  DROP TABLE "cross_contamination_locales" CASCADE;
  DROP TABLE "_cross_contamination_v" CASCADE;
  DROP TABLE "_cross_contamination_v_locales" CASCADE;
  DROP TABLE "lead_time" CASCADE;
  DROP TABLE "_lead_time_v" CASCADE;
  DROP TABLE "closed_until" CASCADE;
  DROP TABLE "closed_until_locales" CASCADE;
  DROP TABLE "_closed_until_v" CASCADE;
  DROP TABLE "_closed_until_v_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_items_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_categories_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_occasions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_sponges_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_fillings_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_allergens_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_media_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_payload_folders_fk";
  
  DROP INDEX "payload_locked_documents_rels_items_id_idx";
  DROP INDEX "payload_locked_documents_rels_categories_id_idx";
  DROP INDEX "payload_locked_documents_rels_occasions_id_idx";
  DROP INDEX "payload_locked_documents_rels_sponges_id_idx";
  DROP INDEX "payload_locked_documents_rels_fillings_id_idx";
  DROP INDEX "payload_locked_documents_rels_allergens_id_idx";
  DROP INDEX "payload_locked_documents_rels_media_id_idx";
  DROP INDEX "payload_locked_documents_rels_payload_folders_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "items_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "categories_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "occasions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "sponges_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "fillings_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "allergens_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "media_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "payload_folders_id";
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_items_status";
  DROP TYPE "public"."enum__items_v_version_status";
  DROP TYPE "public"."enum__items_v_published_locale";
  DROP TYPE "public"."enum_categories_catalogue";
  DROP TYPE "public"."enum_payload_folders_folder_type";
  DROP TYPE "public"."enum_cross_contamination_status";
  DROP TYPE "public"."enum__cross_contamination_v_version_status";
  DROP TYPE "public"."enum__cross_contamination_v_published_locale";
  DROP TYPE "public"."enum_lead_time_status";
  DROP TYPE "public"."enum__lead_time_v_version_status";
  DROP TYPE "public"."enum__lead_time_v_published_locale";
  DROP TYPE "public"."enum_closed_until_status";
  DROP TYPE "public"."enum__closed_until_v_version_status";
  DROP TYPE "public"."enum__closed_until_v_published_locale";`)
}
