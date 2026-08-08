import path from 'path';
import { fileURLToPath } from 'url';

import { postgresAdapter } from '@payloadcms/db-postgres';
import { buildConfig } from 'payload';

import { Users } from './cms/collections/Users';
import { About } from './cms/globals/About';
import { forwardEmailAdapter } from './cms/email/forwardEmail';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Where the site actually lives.
 *
 * COOLIFY_URL is injected into the container by the platform and already holds
 * the app's domain, so the deploy does not need a second copy of it that can
 * drift -- change the domain in Coolify and this follows. PAYLOAD_SERVER_URL is
 * kept ahead of it as an escape hatch for the day mail should come from
 * brandywinecoins.net instead.
 */
const SERVER_URL =
  process.env.PAYLOAD_SERVER_URL || process.env.COOLIFY_URL || 'http://localhost:3000';

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
  /* Where the site actually lives, and it has to be stated.
   *
   * Payload builds password-reset links from this. Left unset it derives a host
   * from the request and then checks it against the CORS/CSRF allowlist -- which
   * is also unset, so nothing matches and it falls back to an empty string. The
   * reset email then carries `/admin/reset/<token>` with no host at all, which is
   * not a link. It warns in the log and sends the mail anyway.
   *
   * Behind Traefik the Host header is not something to trust for this either.
   * One value, set explicitly, per environment.
   */
  serverURL: SERVER_URL,
  cors: [SERVER_URL],
  csrf: [SERVER_URL],
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '— Brandywine Coins',
    },
    components: {
      // The splitter is a route, not a collection, so the nav does not know
      // about it on its own. Without this link the tool is bookmark-only.
      afterNavLinks: ['@/cms/components/SplitterNavLink#SplitterNavLink'],
    },
  },
  collections: [Users],
  globals: [About],
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
  /* Without an adapter Payload writes mail to the console, which means no
   * password reset: a forgotten password needs an admin, and a lost admin
   * password needs psql. See #53.
   *
   * The from address is on ericdahl.dev because that is a domain ForwardEmail is
   * authoritative for -- it carries DKIM and a strict DMARC policy. Sending as
   * brandywinecoins.net would not: its DNS still lives at Hostinger, and mail
   * claiming that domain without alignment there lands in spam. The display name
   * is what Mike will recognise in his inbox; the address is just where it is
   * allowed to come from.
   */
  email: forwardEmailAdapter({
    apiKey: process.env.FORWARDEMAIL_API_KEY,
    defaultFromAddress: 'no-reply@ericdahl.dev',
    defaultFromName: 'Brandywine Coins',
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'cms/payload-types.ts'),
  },
  db: postgresAdapter({
    // Migrations, not push. The production database is not a scratch pad, and
    // schema has to arrive by a reviewed file rather than by whatever the app
    // inferred on boot.
    //
    // push: false is load bearing, not decoration. Left on, the adapter syncs
    // schema in development and then `payload migrate` notices the drift and
    // *prompts* -- "data loss will occur, proceed?" -- which in a deploy is not
    // a failure but a hang, waiting on a stdin nobody is attached to.
    push: false,
    migrationDir: path.resolve(dirname, 'cms/migrations'),
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
});
