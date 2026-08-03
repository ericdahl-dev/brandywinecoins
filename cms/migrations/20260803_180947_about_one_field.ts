import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/**
 * Collapse the About copy from an array of paragraphs into one `body` field.
 *
 * Hand-written, because what `migrate:create` generated was both lossy and
 * broken:
 *
 *     DROP TABLE "about_paragraphs" CASCADE;
 *     ALTER TABLE "about" ADD COLUMN "body" varchar NOT NULL;
 *
 * It drops the paragraphs before reading them, so Mike's copy would go with the
 * table. And adding a NOT NULL column with no default fails outright against a
 * row that already exists, so it would not have run to completion either.
 *
 * The order here is the point: add the column nullable, fold the existing rows
 * into it in `_order`, and only then tighten the constraint and drop the table.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "about" ADD COLUMN "body" varchar;`);

  await db.execute(sql`
    UPDATE "about" a
    SET "body" = COALESCE((
      SELECT string_agg(p."text", E'\n\n' ORDER BY p."_order")
      FROM "about_paragraphs" p
      WHERE p."_parent_id" = a."id"
    ), '');
  `);

  await db.execute(sql`ALTER TABLE "about" ALTER COLUMN "body" SET NOT NULL;`);
  await db.execute(sql`DROP TABLE "about_paragraphs" CASCADE;`);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE "about_paragraphs" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "text" varchar NOT NULL
    );
    ALTER TABLE "about_paragraphs" ADD CONSTRAINT "about_paragraphs_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."about"("id")
      ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "about_paragraphs_order_idx" ON "about_paragraphs" USING btree ("_order");
    CREATE INDEX "about_paragraphs_parent_id_idx" ON "about_paragraphs" USING btree ("_parent_id");
  `);

  // Split back on blank lines, preserving order, so down is a real inverse
  // rather than a schema reset that quietly discards the copy.
  await db.execute(sql`
    INSERT INTO "about_paragraphs" ("_order", "_parent_id", "id", "text")
    SELECT t.ord, a."id", gen_random_uuid()::varchar, btrim(t.part)
    FROM "about" a,
         unnest(string_to_array(a."body", E'\n\n')) WITH ORDINALITY AS t(part, ord)
    WHERE btrim(t.part) <> '';
  `);

  await db.execute(sql`ALTER TABLE "about" DROP COLUMN "body";`);
}
