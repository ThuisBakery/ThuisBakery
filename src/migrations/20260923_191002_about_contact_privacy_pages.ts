import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_about_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__about_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__about_v_published_locale" AS ENUM('en', 'nl');
  CREATE TYPE "public"."enum_contact_hours_rows_days" AS ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
  CREATE TYPE "public"."enum_contact_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__contact_v_version_hours_rows_days" AS ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday');
  CREATE TYPE "public"."enum__contact_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__contact_v_published_locale" AS ENUM('en', 'nl');
  CREATE TYPE "public"."enum_custom_order_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__custom_order_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__custom_order_v_published_locale" AS ENUM('en', 'nl');
  CREATE TYPE "public"."enum_privacy_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__privacy_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__privacy_v_published_locale" AS ENUM('en', 'nl');
  CREATE TABLE "about" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"photograph_id" integer,
  	"_status" "enum_about_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "about_locales" (
  	"heading" varchar,
  	"story" jsonb,
  	"cakes_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_about_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_photograph_id" integer,
  	"version__status" "enum__about_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__about_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_about_v_locales" (
  	"version_heading" varchar,
  	"version_story" jsonb,
  	"version_cakes_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "contact_hours_rows_days" (
  	"order" integer NOT NULL,
  	"parent_id" varchar NOT NULL,
  	"value" "enum_contact_hours_rows_days",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "contact_hours_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"opens" varchar,
  	"closes" varchar
  );
  
  CREATE TABLE "contact_faq_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "contact_faq_questions_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "contact" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"details_email" varchar,
  	"details_telephone" varchar,
  	"details_instagram" varchar,
  	"details_photograph_id" integer,
  	"_status" "enum_contact_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "contact_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"hours_note" varchar,
  	"collection_heading" varchar,
  	"collection_policy" varchar,
  	"faq_heading" varchar,
  	"form_heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_contact_v_version_hours_rows_days" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum__contact_v_version_hours_rows_days",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "_contact_v_version_hours_rows" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"opens" varchar,
  	"closes" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_contact_v_version_faq_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_contact_v_version_faq_questions_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_contact_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_details_email" varchar,
  	"version_details_telephone" varchar,
  	"version_details_instagram" varchar,
  	"version_details_photograph_id" integer,
  	"version__status" "enum__contact_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__contact_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_contact_v_locales" (
  	"version_heading" varchar,
  	"version_intro" varchar,
  	"version_hours_note" varchar,
  	"version_collection_heading" varchar,
  	"version_collection_policy" varchar,
  	"version_faq_heading" varchar,
  	"version_form_heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "custom_order" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"photograph_id" integer,
  	"_status" "enum_custom_order_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "custom_order_locales" (
  	"heading" varchar,
  	"intro" varchar,
  	"form_heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_custom_order_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_photograph_id" integer,
  	"version__status" "enum__custom_order_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__custom_order_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_custom_order_v_locales" (
  	"version_heading" varchar,
  	"version_intro" varchar,
  	"version_form_heading" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "privacy" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"last_updated" timestamp(3) with time zone,
  	"_status" "enum_privacy_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "privacy_locales" (
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_privacy_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_last_updated" timestamp(3) with time zone,
  	"version__status" "enum__privacy_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__privacy_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_privacy_v_locales" (
  	"version_body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "about" ADD CONSTRAINT "about_photograph_id_media_id_fk" FOREIGN KEY ("photograph_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "about_locales" ADD CONSTRAINT "about_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."about"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_about_v" ADD CONSTRAINT "_about_v_version_photograph_id_media_id_fk" FOREIGN KEY ("version_photograph_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_about_v_locales" ADD CONSTRAINT "_about_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_about_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contact_hours_rows_days" ADD CONSTRAINT "contact_hours_rows_days_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."contact_hours_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contact_hours_rows" ADD CONSTRAINT "contact_hours_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contact"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contact_faq_questions" ADD CONSTRAINT "contact_faq_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contact"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contact_faq_questions_locales" ADD CONSTRAINT "contact_faq_questions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contact_faq_questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "contact" ADD CONSTRAINT "contact_details_photograph_id_media_id_fk" FOREIGN KEY ("details_photograph_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contact_locales" ADD CONSTRAINT "contact_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."contact"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_contact_v_version_hours_rows_days" ADD CONSTRAINT "_contact_v_version_hours_rows_days_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_contact_v_version_hours_rows"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_contact_v_version_hours_rows" ADD CONSTRAINT "_contact_v_version_hours_rows_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_contact_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_contact_v_version_faq_questions" ADD CONSTRAINT "_contact_v_version_faq_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_contact_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_contact_v_version_faq_questions_locales" ADD CONSTRAINT "_contact_v_version_faq_questions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_contact_v_version_faq_questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_contact_v" ADD CONSTRAINT "_contact_v_version_details_photograph_id_media_id_fk" FOREIGN KEY ("version_details_photograph_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_contact_v_locales" ADD CONSTRAINT "_contact_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_contact_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "custom_order" ADD CONSTRAINT "custom_order_photograph_id_media_id_fk" FOREIGN KEY ("photograph_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "custom_order_locales" ADD CONSTRAINT "custom_order_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."custom_order"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_custom_order_v" ADD CONSTRAINT "_custom_order_v_version_photograph_id_media_id_fk" FOREIGN KEY ("version_photograph_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_custom_order_v_locales" ADD CONSTRAINT "_custom_order_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_custom_order_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "privacy_locales" ADD CONSTRAINT "privacy_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."privacy"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_privacy_v_locales" ADD CONSTRAINT "_privacy_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_privacy_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "about_photograph_idx" ON "about" USING btree ("photograph_id");
  CREATE INDEX "about__status_idx" ON "about" USING btree ("_status");
  CREATE UNIQUE INDEX "about_locales_locale_parent_id_unique" ON "about_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_about_v_version_version_photograph_idx" ON "_about_v" USING btree ("version_photograph_id");
  CREATE INDEX "_about_v_version_version__status_idx" ON "_about_v" USING btree ("version__status");
  CREATE INDEX "_about_v_created_at_idx" ON "_about_v" USING btree ("created_at");
  CREATE INDEX "_about_v_updated_at_idx" ON "_about_v" USING btree ("updated_at");
  CREATE INDEX "_about_v_snapshot_idx" ON "_about_v" USING btree ("snapshot");
  CREATE INDEX "_about_v_published_locale_idx" ON "_about_v" USING btree ("published_locale");
  CREATE INDEX "_about_v_latest_idx" ON "_about_v" USING btree ("latest");
  CREATE INDEX "_about_v_autosave_idx" ON "_about_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_about_v_locales_locale_parent_id_unique" ON "_about_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "contact_hours_rows_days_order_idx" ON "contact_hours_rows_days" USING btree ("order");
  CREATE INDEX "contact_hours_rows_days_parent_idx" ON "contact_hours_rows_days" USING btree ("parent_id");
  CREATE INDEX "contact_hours_rows_order_idx" ON "contact_hours_rows" USING btree ("_order");
  CREATE INDEX "contact_hours_rows_parent_id_idx" ON "contact_hours_rows" USING btree ("_parent_id");
  CREATE INDEX "contact_faq_questions_order_idx" ON "contact_faq_questions" USING btree ("_order");
  CREATE INDEX "contact_faq_questions_parent_id_idx" ON "contact_faq_questions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "contact_faq_questions_locales_locale_parent_id_unique" ON "contact_faq_questions_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "contact_details_details_photograph_idx" ON "contact" USING btree ("details_photograph_id");
  CREATE INDEX "contact__status_idx" ON "contact" USING btree ("_status");
  CREATE UNIQUE INDEX "contact_locales_locale_parent_id_unique" ON "contact_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_contact_v_version_hours_rows_days_order_idx" ON "_contact_v_version_hours_rows_days" USING btree ("order");
  CREATE INDEX "_contact_v_version_hours_rows_days_parent_idx" ON "_contact_v_version_hours_rows_days" USING btree ("parent_id");
  CREATE INDEX "_contact_v_version_hours_rows_order_idx" ON "_contact_v_version_hours_rows" USING btree ("_order");
  CREATE INDEX "_contact_v_version_hours_rows_parent_id_idx" ON "_contact_v_version_hours_rows" USING btree ("_parent_id");
  CREATE INDEX "_contact_v_version_faq_questions_order_idx" ON "_contact_v_version_faq_questions" USING btree ("_order");
  CREATE INDEX "_contact_v_version_faq_questions_parent_id_idx" ON "_contact_v_version_faq_questions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_contact_v_version_faq_questions_locales_locale_parent_id_un" ON "_contact_v_version_faq_questions_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_contact_v_version_details_version_details_photograph_idx" ON "_contact_v" USING btree ("version_details_photograph_id");
  CREATE INDEX "_contact_v_version_version__status_idx" ON "_contact_v" USING btree ("version__status");
  CREATE INDEX "_contact_v_created_at_idx" ON "_contact_v" USING btree ("created_at");
  CREATE INDEX "_contact_v_updated_at_idx" ON "_contact_v" USING btree ("updated_at");
  CREATE INDEX "_contact_v_snapshot_idx" ON "_contact_v" USING btree ("snapshot");
  CREATE INDEX "_contact_v_published_locale_idx" ON "_contact_v" USING btree ("published_locale");
  CREATE INDEX "_contact_v_latest_idx" ON "_contact_v" USING btree ("latest");
  CREATE INDEX "_contact_v_autosave_idx" ON "_contact_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_contact_v_locales_locale_parent_id_unique" ON "_contact_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "custom_order_photograph_idx" ON "custom_order" USING btree ("photograph_id");
  CREATE INDEX "custom_order__status_idx" ON "custom_order" USING btree ("_status");
  CREATE UNIQUE INDEX "custom_order_locales_locale_parent_id_unique" ON "custom_order_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_custom_order_v_version_version_photograph_idx" ON "_custom_order_v" USING btree ("version_photograph_id");
  CREATE INDEX "_custom_order_v_version_version__status_idx" ON "_custom_order_v" USING btree ("version__status");
  CREATE INDEX "_custom_order_v_created_at_idx" ON "_custom_order_v" USING btree ("created_at");
  CREATE INDEX "_custom_order_v_updated_at_idx" ON "_custom_order_v" USING btree ("updated_at");
  CREATE INDEX "_custom_order_v_snapshot_idx" ON "_custom_order_v" USING btree ("snapshot");
  CREATE INDEX "_custom_order_v_published_locale_idx" ON "_custom_order_v" USING btree ("published_locale");
  CREATE INDEX "_custom_order_v_latest_idx" ON "_custom_order_v" USING btree ("latest");
  CREATE INDEX "_custom_order_v_autosave_idx" ON "_custom_order_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_custom_order_v_locales_locale_parent_id_unique" ON "_custom_order_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "privacy__status_idx" ON "privacy" USING btree ("_status");
  CREATE UNIQUE INDEX "privacy_locales_locale_parent_id_unique" ON "privacy_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_privacy_v_version_version__status_idx" ON "_privacy_v" USING btree ("version__status");
  CREATE INDEX "_privacy_v_created_at_idx" ON "_privacy_v" USING btree ("created_at");
  CREATE INDEX "_privacy_v_updated_at_idx" ON "_privacy_v" USING btree ("updated_at");
  CREATE INDEX "_privacy_v_snapshot_idx" ON "_privacy_v" USING btree ("snapshot");
  CREATE INDEX "_privacy_v_published_locale_idx" ON "_privacy_v" USING btree ("published_locale");
  CREATE INDEX "_privacy_v_latest_idx" ON "_privacy_v" USING btree ("latest");
  CREATE INDEX "_privacy_v_autosave_idx" ON "_privacy_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_privacy_v_locales_locale_parent_id_unique" ON "_privacy_v_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "about" CASCADE;
  DROP TABLE "about_locales" CASCADE;
  DROP TABLE "_about_v" CASCADE;
  DROP TABLE "_about_v_locales" CASCADE;
  DROP TABLE "contact_hours_rows_days" CASCADE;
  DROP TABLE "contact_hours_rows" CASCADE;
  DROP TABLE "contact_faq_questions" CASCADE;
  DROP TABLE "contact_faq_questions_locales" CASCADE;
  DROP TABLE "contact" CASCADE;
  DROP TABLE "contact_locales" CASCADE;
  DROP TABLE "_contact_v_version_hours_rows_days" CASCADE;
  DROP TABLE "_contact_v_version_hours_rows" CASCADE;
  DROP TABLE "_contact_v_version_faq_questions" CASCADE;
  DROP TABLE "_contact_v_version_faq_questions_locales" CASCADE;
  DROP TABLE "_contact_v" CASCADE;
  DROP TABLE "_contact_v_locales" CASCADE;
  DROP TABLE "custom_order" CASCADE;
  DROP TABLE "custom_order_locales" CASCADE;
  DROP TABLE "_custom_order_v" CASCADE;
  DROP TABLE "_custom_order_v_locales" CASCADE;
  DROP TABLE "privacy" CASCADE;
  DROP TABLE "privacy_locales" CASCADE;
  DROP TABLE "_privacy_v" CASCADE;
  DROP TABLE "_privacy_v_locales" CASCADE;
  DROP TYPE "public"."enum_about_status";
  DROP TYPE "public"."enum__about_v_version_status";
  DROP TYPE "public"."enum__about_v_published_locale";
  DROP TYPE "public"."enum_contact_hours_rows_days";
  DROP TYPE "public"."enum_contact_status";
  DROP TYPE "public"."enum__contact_v_version_hours_rows_days";
  DROP TYPE "public"."enum__contact_v_version_status";
  DROP TYPE "public"."enum__contact_v_published_locale";
  DROP TYPE "public"."enum_custom_order_status";
  DROP TYPE "public"."enum__custom_order_v_version_status";
  DROP TYPE "public"."enum__custom_order_v_published_locale";
  DROP TYPE "public"."enum_privacy_status";
  DROP TYPE "public"."enum__privacy_v_version_status";
  DROP TYPE "public"."enum__privacy_v_published_locale";`)
}
