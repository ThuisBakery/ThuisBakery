import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "submissions" ADD COLUMN "reference" varchar;
  CREATE UNIQUE INDEX "submissions_reference_idx" ON "submissions" USING btree ("reference");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "submissions_reference_idx";
  ALTER TABLE "submissions" DROP COLUMN "reference";`)
}
