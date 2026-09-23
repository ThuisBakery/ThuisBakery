import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_submissions_delivery_to_jana" AS ENUM('pending', 'sent', 'delayed', 'delivered', 'not-sent', 'bounced', 'failed', 'complained');
  CREATE TYPE "public"."enum_submissions_delivery_to_customer" AS ENUM('pending', 'sent', 'delayed', 'delivered', 'not-sent', 'bounced', 'failed', 'complained');
  ALTER TABLE "submissions" ADD COLUMN "delivery_to_jana" "enum_submissions_delivery_to_jana" DEFAULT 'pending';
  ALTER TABLE "submissions" ADD COLUMN "delivery_to_jana_email_id" varchar;
  ALTER TABLE "submissions" ADD COLUMN "delivery_to_customer" "enum_submissions_delivery_to_customer" DEFAULT 'pending';
  ALTER TABLE "submissions" ADD COLUMN "delivery_to_customer_email_id" varchar;
  ALTER TABLE "submissions" ADD COLUMN "inspiration_photo" varchar;
  CREATE INDEX "submissions_delivery_delivery_to_jana_idx" ON "submissions" USING btree ("delivery_to_jana");
  CREATE INDEX "submissions_delivery_delivery_to_jana_email_id_idx" ON "submissions" USING btree ("delivery_to_jana_email_id");
  CREATE INDEX "submissions_delivery_delivery_to_customer_idx" ON "submissions" USING btree ("delivery_to_customer");
  CREATE INDEX "submissions_delivery_delivery_to_customer_email_id_idx" ON "submissions" USING btree ("delivery_to_customer_email_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "submissions_delivery_delivery_to_jana_idx";
  DROP INDEX "submissions_delivery_delivery_to_jana_email_id_idx";
  DROP INDEX "submissions_delivery_delivery_to_customer_idx";
  DROP INDEX "submissions_delivery_delivery_to_customer_email_id_idx";
  ALTER TABLE "submissions" DROP COLUMN "delivery_to_jana";
  ALTER TABLE "submissions" DROP COLUMN "delivery_to_jana_email_id";
  ALTER TABLE "submissions" DROP COLUMN "delivery_to_customer";
  ALTER TABLE "submissions" DROP COLUMN "delivery_to_customer_email_id";
  ALTER TABLE "submissions" DROP COLUMN "inspiration_photo";
  DROP TYPE "public"."enum_submissions_delivery_to_jana";
  DROP TYPE "public"."enum_submissions_delivery_to_customer";`)
}
