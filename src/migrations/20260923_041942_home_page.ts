import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_home_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__home_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__home_v_published_locale" AS ENUM('en', 'nl');
  CREATE TABLE "home_faq_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "home_faq_questions_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "home" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_photograph_id" integer,
  	"about_photograph_id" integer,
  	"_status" "enum_home_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "home_locales" (
  	"hero_headline" varchar,
  	"hero_intro" varchar,
  	"hero_cakes_label" varchar,
  	"hero_nibbles_label" varchar,
  	"facts_pickup_title" varchar,
  	"facts_pickup_detail" varchar,
  	"facts_price_detail" varchar,
  	"menu_heading" varchar,
  	"about_heading" varchar,
  	"about_body" varchar,
  	"about_link_label" varchar,
  	"allergens_heading" varchar,
  	"allergens_intro" varchar,
  	"quote_text" varchar,
  	"quote_attribution" varchar,
  	"faq_heading" varchar,
  	"closing_heading" varchar,
  	"closing_body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_home_v_version_faq_questions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_home_v_version_faq_questions_locales" (
  	"question" varchar,
  	"answer" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_home_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_hero_photograph_id" integer,
  	"version_about_photograph_id" integer,
  	"version__status" "enum__home_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__home_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_home_v_locales" (
  	"version_hero_headline" varchar,
  	"version_hero_intro" varchar,
  	"version_hero_cakes_label" varchar,
  	"version_hero_nibbles_label" varchar,
  	"version_facts_pickup_title" varchar,
  	"version_facts_pickup_detail" varchar,
  	"version_facts_price_detail" varchar,
  	"version_menu_heading" varchar,
  	"version_about_heading" varchar,
  	"version_about_body" varchar,
  	"version_about_link_label" varchar,
  	"version_allergens_heading" varchar,
  	"version_allergens_intro" varchar,
  	"version_quote_text" varchar,
  	"version_quote_attribution" varchar,
  	"version_faq_heading" varchar,
  	"version_closing_heading" varchar,
  	"version_closing_body" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "home_faq_questions" ADD CONSTRAINT "home_faq_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home_faq_questions_locales" ADD CONSTRAINT "home_faq_questions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home_faq_questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_hero_photograph_id_media_id_fk" FOREIGN KEY ("hero_photograph_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home" ADD CONSTRAINT "home_about_photograph_id_media_id_fk" FOREIGN KEY ("about_photograph_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "home_locales" ADD CONSTRAINT "home_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."home"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_faq_questions" ADD CONSTRAINT "_home_v_version_faq_questions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v_version_faq_questions_locales" ADD CONSTRAINT "_home_v_version_faq_questions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v_version_faq_questions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_home_v" ADD CONSTRAINT "_home_v_version_hero_photograph_id_media_id_fk" FOREIGN KEY ("version_hero_photograph_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v" ADD CONSTRAINT "_home_v_version_about_photograph_id_media_id_fk" FOREIGN KEY ("version_about_photograph_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_home_v_locales" ADD CONSTRAINT "_home_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_home_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "home_faq_questions_order_idx" ON "home_faq_questions" USING btree ("_order");
  CREATE INDEX "home_faq_questions_parent_id_idx" ON "home_faq_questions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "home_faq_questions_locales_locale_parent_id_unique" ON "home_faq_questions_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "home_hero_hero_photograph_idx" ON "home" USING btree ("hero_photograph_id");
  CREATE INDEX "home_about_about_photograph_idx" ON "home" USING btree ("about_photograph_id");
  CREATE INDEX "home__status_idx" ON "home" USING btree ("_status");
  CREATE UNIQUE INDEX "home_locales_locale_parent_id_unique" ON "home_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_home_v_version_faq_questions_order_idx" ON "_home_v_version_faq_questions" USING btree ("_order");
  CREATE INDEX "_home_v_version_faq_questions_parent_id_idx" ON "_home_v_version_faq_questions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "_home_v_version_faq_questions_locales_locale_parent_id_uniqu" ON "_home_v_version_faq_questions_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_home_v_version_hero_version_hero_photograph_idx" ON "_home_v" USING btree ("version_hero_photograph_id");
  CREATE INDEX "_home_v_version_about_version_about_photograph_idx" ON "_home_v" USING btree ("version_about_photograph_id");
  CREATE INDEX "_home_v_version_version__status_idx" ON "_home_v" USING btree ("version__status");
  CREATE INDEX "_home_v_created_at_idx" ON "_home_v" USING btree ("created_at");
  CREATE INDEX "_home_v_updated_at_idx" ON "_home_v" USING btree ("updated_at");
  CREATE INDEX "_home_v_snapshot_idx" ON "_home_v" USING btree ("snapshot");
  CREATE INDEX "_home_v_published_locale_idx" ON "_home_v" USING btree ("published_locale");
  CREATE INDEX "_home_v_latest_idx" ON "_home_v" USING btree ("latest");
  CREATE INDEX "_home_v_autosave_idx" ON "_home_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_home_v_locales_locale_parent_id_unique" ON "_home_v_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "home_faq_questions" CASCADE;
  DROP TABLE "home_faq_questions_locales" CASCADE;
  DROP TABLE "home" CASCADE;
  DROP TABLE "home_locales" CASCADE;
  DROP TABLE "_home_v_version_faq_questions" CASCADE;
  DROP TABLE "_home_v_version_faq_questions_locales" CASCADE;
  DROP TABLE "_home_v" CASCADE;
  DROP TABLE "_home_v_locales" CASCADE;
  DROP TYPE "public"."enum_home_status";
  DROP TYPE "public"."enum__home_v_version_status";
  DROP TYPE "public"."enum__home_v_published_locale";`)
}
