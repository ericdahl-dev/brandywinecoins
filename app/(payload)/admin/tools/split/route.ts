import config from '@payload-config';
import { getPayload } from 'payload';

import { splitterHtml } from './split-html';

/**
 * The Scan Splitter, behind the admin's login (#81, the auth gate for #74
 * phase 2). A literal route wins the URL over the admin catch-all
 * (`../[[...segments]]`), so this handler owns /admin/tools/split while the
 * rest of /admin stays Payload's.
 *
 * Deliberately a route handler and not a Payload custom admin view: custom
 * views are public by default, and the whole point here is the gate.
 * `payload.auth` reads the same cookie the admin panel sets, so logging in
 * at /admin/login is the only credential the tool needs.
 *
 * The HTML arrives as a generated module (`split-html.ts`, written by
 * tools/scan-splitter/package.sh) rather than an fs.readFile: a module import
 * cannot fail to be bundled, while a loose file has to survive the deploy.
 */
export async function GET(request: Request) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: request.headers });

  if (!user) {
    // The redirect param is honoured by Payload's login view, so Mike lands
    // back on the tool after signing in instead of on the dashboard.
    return Response.redirect(
      new URL('/admin/login?redirect=%2Fadmin%2Ftools%2Fsplit', request.url),
      302,
    );
  }

  return new Response(splitterHtml, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
