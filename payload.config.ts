import path from 'path';
import { fileURLToPath } from 'url';

import { postgresAdapter } from '@payloadcms/db-postgres';
import { buildConfig } from 'payload';

import { Users } from './cms/collections/Users';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Payload runs inside this Next app rather than beside it, so there is no second
 * service to deploy and content is read in a server component rather than over
 * the network.
 *
 * Deliberately narrow. The artwork is measured, not authored -- the wordmark is a
 * curve trace of the supplied alpha and the background plates are derived by
 * tools/derive-plates.py against gradient stops in Hero.module.css. None of that
 * is editable here, and no upload collection exists to invite it. See #41.
 */
export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '— Brandywine Coins',
    },
  },
  collections: [Users],
  globals: [],
  /* No rich text editor, deliberately.
   *
   * `editor` is optional, and the copy this manages is plain prose whose exact
   * characters matter: an unspaced em dash Mike asked for, curly apostrophes,
   * a closing line with no full stop, and the thin spaces and word joiners that
   * typeset the dash (#43). A rich text editor stores a node tree and is free to
   * normalise those. Plain text fields store what was typed, and the typography
   * is applied at render.
   *
   * It also stays out of the dependency tree: @payloadcms/richtext-lexical
   * carries a top-level await, and nothing here needs a node tree.
   */
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'cms/payload-types.ts'),
  },
  db: postgresAdapter({
    // Migrations, not push. The production database is not a scratch pad, and
    // schema has to arrive by a reviewed file rather than by whatever the app
    // inferred on boot.
    migrationDir: path.resolve(dirname, 'cms/migrations'),
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
});
