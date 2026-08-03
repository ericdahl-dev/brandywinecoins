import { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

import { aboutSeed } from '../seed/about';

/**
 * Data, not schema. Seeds the About copy so a fresh database renders the page
 * rather than an empty section.
 *
 * Safe to ship to production precisely because migrations run once and are
 * recorded: this cannot come back on a later deploy and overwrite Mike's edits.
 * That is the reason the seed lives here rather than in a script somebody has to
 * remember not to re-run.
 */
export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const existing = await payload.findGlobal({ slug: 'about', req });
  const hasCopy = Array.isArray(existing?.paragraphs) && existing.paragraphs.length > 0;
  if (hasCopy) return;

  await payload.updateGlobal({
    slug: 'about',
    req,
    data: {
      paragraphs: aboutSeed.paragraphs.map((text) => ({ text })),
      signoff: aboutSeed.signoff,
      pullQuote: aboutSeed.pullQuote,
    },
  });
}

export async function down({ payload, req }: MigrateDownArgs): Promise<void> {
  await payload.updateGlobal({
    slug: 'about',
    req,
    data: { paragraphs: [], signoff: null, pullQuote: null },
  });
}
