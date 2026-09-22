import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
 * Hand-edited from the generated file. Generated, it added `slug`, `tagline` and
 * `photograph_id` as NOT NULL with no default, which fails on any Category that already
 * exists. So each is added nullable and backfilled first: `slug` from the id (Jana renames
 * it in the admin), `tagline` from the name. `photograph_id` stays nullable in the
 * database, because there is no photograph to backfill it with; Payload's `required`
 * still enforces it on every save. The JSON snapshot is untouched, so the next generated
 * migration does not see a difference.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categories" ADD COLUMN "generate_slug" boolean DEFAULT true;
  ALTER TABLE "categories" ADD COLUMN "slug" varchar;
  UPDATE "categories" SET "slug" = 'category-' || "id" WHERE "slug" IS NULL;
  ALTER TABLE "categories" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "categories" ADD COLUMN "photograph_id" integer;
  ALTER TABLE "categories" ADD COLUMN "price" numeric;
  ALTER TABLE "categories" ADD COLUMN "price_from" boolean DEFAULT false;
  ALTER TABLE "categories_locales" ADD COLUMN "tagline" varchar;
  UPDATE "categories_locales" SET "tagline" = COALESCE("name", '') WHERE "tagline" IS NULL;
  ALTER TABLE "categories_locales" ALTER COLUMN "tagline" SET NOT NULL;
  ALTER TABLE "categories_locales" ADD COLUMN "note" varchar;
  ALTER TABLE "media" ADD COLUMN "prefix" varchar DEFAULT '';
  ALTER TABLE "media" ADD COLUMN "_objectkey" varchar;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_photograph_id_media_id_fk" FOREIGN KEY ("photograph_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_photograph_idx" ON "categories" USING btree ("photograph_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "categories" DROP CONSTRAINT "categories_photograph_id_media_id_fk";
  
  DROP INDEX "categories_slug_idx";
  DROP INDEX "categories_photograph_idx";
  ALTER TABLE "categories" DROP COLUMN "generate_slug";
  ALTER TABLE "categories" DROP COLUMN "slug";
  ALTER TABLE "categories" DROP COLUMN "photograph_id";
  ALTER TABLE "categories" DROP COLUMN "price";
  ALTER TABLE "categories" DROP COLUMN "price_from";
  ALTER TABLE "categories_locales" DROP COLUMN "tagline";
  ALTER TABLE "categories_locales" DROP COLUMN "note";
  ALTER TABLE "media" DROP COLUMN "prefix";
  ALTER TABLE "media" DROP COLUMN "_objectkey";`)
}
