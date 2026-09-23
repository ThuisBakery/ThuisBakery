import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_submissions_enquiry_type" AS ENUM('item', 'custom-order', 'contact');
  CREATE TYPE "public"."enum_submissions_locale" AS ENUM('en', 'nl');
  CREATE TYPE "public"."enum_submissions_estimate_currency" AS ENUM('EUR');
  CREATE TABLE "submissions_estimate_lines" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"unit_amount" numeric,
  	"quantity" numeric,
  	"amount" numeric
  );
  
  CREATE TABLE "submissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"enquiry_type" "enum_submissions_enquiry_type" NOT NULL,
  	"locale" "enum_submissions_locale" NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"item_id" integer,
  	"item_title" varchar,
  	"size" varchar,
  	"quantity" numeric,
  	"sponge" varchar,
  	"filling" varchar,
  	"requested_pickup_date" timestamp(3) with time zone,
  	"special_requests" varchar,
  	"message" varchar,
  	"estimate_total" numeric,
  	"estimate_currency" "enum_submissions_estimate_currency",
  	"estimate_provisional" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "submissions_id" integer;
  ALTER TABLE "submissions_estimate_lines" ADD CONSTRAINT "submissions_estimate_lines_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "submissions" ADD CONSTRAINT "submissions_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "submissions_estimate_lines_order_idx" ON "submissions_estimate_lines" USING btree ("_order");
  CREATE INDEX "submissions_estimate_lines_parent_id_idx" ON "submissions_estimate_lines" USING btree ("_parent_id");
  CREATE INDEX "submissions_enquiry_type_idx" ON "submissions" USING btree ("enquiry_type");
  CREATE INDEX "submissions_locale_idx" ON "submissions" USING btree ("locale");
  CREATE INDEX "submissions_email_idx" ON "submissions" USING btree ("email");
  CREATE INDEX "submissions_item_idx" ON "submissions" USING btree ("item_id");
  CREATE INDEX "submissions_requested_pickup_date_idx" ON "submissions" USING btree ("requested_pickup_date");
  CREATE INDEX "submissions_updated_at_idx" ON "submissions" USING btree ("updated_at");
  CREATE INDEX "submissions_created_at_idx" ON "submissions" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_submissions_fk" FOREIGN KEY ("submissions_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_submissions_id_idx" ON "payload_locked_documents_rels" USING btree ("submissions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "submissions_estimate_lines" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "submissions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "submissions_estimate_lines" CASCADE;
  DROP TABLE "submissions" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_submissions_fk";
  
  DROP INDEX "payload_locked_documents_rels_submissions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "submissions_id";
  DROP TYPE "public"."enum_submissions_enquiry_type";
  DROP TYPE "public"."enum_submissions_locale";
  DROP TYPE "public"."enum_submissions_estimate_currency";`)
}
