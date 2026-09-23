import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "items_locales" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "items_locales" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "_items_v_locales" ADD COLUMN "version_meta_title" varchar;
  ALTER TABLE "_items_v_locales" ADD COLUMN "version_meta_description" varchar;
  ALTER TABLE "pages_locales" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "pages_locales" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "_pages_v_locales" ADD COLUMN "version_meta_title" varchar;
  ALTER TABLE "_pages_v_locales" ADD COLUMN "version_meta_description" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "items_locales" DROP COLUMN "meta_title";
  ALTER TABLE "items_locales" DROP COLUMN "meta_description";
  ALTER TABLE "_items_v_locales" DROP COLUMN "version_meta_title";
  ALTER TABLE "_items_v_locales" DROP COLUMN "version_meta_description";
  ALTER TABLE "pages_locales" DROP COLUMN "meta_title";
  ALTER TABLE "pages_locales" DROP COLUMN "meta_description";
  ALTER TABLE "_pages_v_locales" DROP COLUMN "version_meta_title";
  ALTER TABLE "_pages_v_locales" DROP COLUMN "version_meta_description";`)
}
