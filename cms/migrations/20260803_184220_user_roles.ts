import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/**
 * Add roles, and make sure an admin still exists afterwards.
 *
 * The generated migration stopped at the column, which defaults to 'editor'.
 * Applied as-is to production that would have demoted the only account there --
 * and since creating users and changing roles are both admin-only, there would
 * have been nobody left who could put it back. A lockout, from a migration that
 * looks harmless.
 *
 * So the existing account is promoted. Lowest id is the one that came from the
 * admin's first-user setup screen, which is the person who stood the site up.
 * On a fresh database this touches nothing, and Users' beforeChange hook handles
 * that case by making the first account an admin as it is created.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor');`);
  await db.execute(
    sql`ALTER TABLE "users" ADD COLUMN "role" "enum_users_role" DEFAULT 'editor' NOT NULL;`,
  );
  await db.execute(sql`
    UPDATE "users" SET "role" = 'admin'
    WHERE "id" = (SELECT "id" FROM "users" ORDER BY "id" LIMIT 1);
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "users" DROP COLUMN "role";`);
  await db.execute(sql`DROP TYPE "public"."enum_users_role";`);
}
