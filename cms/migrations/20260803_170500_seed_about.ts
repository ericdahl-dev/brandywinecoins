import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/**
 * Data, not schema. Seeds the About copy so a fresh database renders the page
 * rather than an empty section.
 *
 * Safe to ship precisely because migrations run once and are recorded: this
 * cannot come back on a later deploy and overwrite Mike's edits. That is why the
 * seed lives here rather than in a script somebody has to remember not to re-run.
 *
 * Raw SQL, and the copy is inlined rather than imported, because a migration is
 * a historical record and has to keep working as the code moves on. The first
 * version of this file did neither: it imported the seed from application code
 * and wrote through `payload.updateGlobal`, which validates against whatever the
 * config says *today*. Collapsing the paragraph array into a single field a few
 * commits later broke both -- and CI builds a fresh database every run, so every
 * migration has to still work, not just the recent ones.
 *
 * Written against the schema as it stood at this point: `about_paragraphs` still
 * exists here and is folded into `about.body` by a later migration.
 */
const PARAGRAPHS = [
  'Brandywine Coins was founded from a lifelong passion for numismatics and the ' +
    'belief that every coin has a story worth preserving. What began as a hobby ' +
    'has grown into an independent business dedicated to helping collectors buy, ' +
    'sell, and learn with confidence.',
  'Based in Wilmington, Delaware, we specialize in quality American and world ' +
    'coins, with a particular interest in historic European coinage, especially ' +
    "from Northern and Central Europe. You may also notice a number of items " +
    "that celebrate Delaware's colonial heritage and the legacy of New Sweden, " +
    'reflecting the history that helped shape our home state.',
  "Whether you're searching for a single collectible, building a specialized " +
    'collection, or looking to sell an inherited estate, every customer receives ' +
    'the same honest and respectful service.',
  'Because we carefully research every item and personally handle each order, ' +
    'response times may occasionally be a little slower than those of larger ' +
    'companies—but every customer receives our full attention and care.',
  "Whether you're a seasoned numismatist or purchasing your very first coin, " +
    "we're glad you're here. We look forward to helping you discover the " +
    'history, artistry, and enjoyment that make coin collecting such a rewarding ' +
    'hobby.',
];

const SIGNOFF = 'Thank you for visiting Brandywine Coins';
const PULL_QUOTE = 'Every coin has a story worth preserving.';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Globals have no row until something writes one.
  await db.execute(sql`
    INSERT INTO "about" ("signoff", "pull_quote", "updated_at", "created_at")
    SELECT ${SIGNOFF}, ${PULL_QUOTE}, now(), now()
    WHERE NOT EXISTS (SELECT 1 FROM "about");
  `);

  // Only seed an empty section, so this is a no-op against a database that
  // already carries copy.
  const { rows } = await db.execute(sql`SELECT count(*)::int AS n FROM "about_paragraphs"`);
  if (Number(rows?.[0]?.n ?? 0) > 0) return;

  for (const [i, text] of PARAGRAPHS.entries()) {
    await db.execute(sql`
      INSERT INTO "about_paragraphs" ("_order", "_parent_id", "id", "text")
      SELECT ${i + 1}, a."id", gen_random_uuid()::varchar, ${text}
      FROM "about" a
      ORDER BY a."id"
      LIMIT 1;
    `);
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DELETE FROM "about_paragraphs";`);
  await db.execute(sql`UPDATE "about" SET "signoff" = NULL, "pull_quote" = NULL;`);
}
