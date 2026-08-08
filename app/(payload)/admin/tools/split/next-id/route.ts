import config from '@payload-config';
import { getPayload } from 'payload';

/**
 * The next free Inventory ID, for the Scan Splitter's prefill (#86). The tool
 * asks here (a relative fetch from /admin/tools/split), this route asks n8n,
 * and n8n asks Airtable with the read-only credential. The chain exists so the
 * page never holds a secret: the shared secret that opens the n8n webhook
 * lives in this server's env and goes no further.
 *
 * Same gate as the splitter route one level up: payload.auth against the
 * admin cookie. No user means a 401 and, deliberately, no upstream call --
 * the n8n webhook is never touched on an unauthenticated request. But a JSON
 * 401 rather than that route's login redirect: the caller is a fetch(), not
 * a person, and the tool treats any non-200 as "no prefill today".
 *
 * Failure here must never break the tool, which also works offline and as a
 * standalone file. Anything short of a good answer -- env var unset, n8n down,
 * a shape we do not recognise -- is a 503 the tool silently shrugs at.
 */

// The production webhook of the "Splitter: next inventory id" n8n workflow.
// Not a secret -- without the header it answers 403 and looks up nothing.
const NEXT_ID_WEBHOOK =
  'https://n8n-bwcoins.ger3.ericdahl.dev/webhook/splitter-next-inventory-id';

/**
 * BWC-2026-0000075 -> BWC-2026-0000076. The prefix and the zero-padding are
 * taken from the max ID itself, not assumed: when the year (or the whole
 * scheme) changes in Airtable, this follows it with no edit here. Whether a
 * new year restarts the counter is an open question for Eric and Mike; until
 * it is answered the current prefix is kept verbatim and the tail increments
 * (the issue's explicit interim call).
 */
function increment(maxId: string): string | null {
  const m = maxId.match(/^(.*?)(\d+)$/);
  if (!m) return null;
  const next = String(BigInt(m[2]) + BigInt(1));
  return m[1] + next.padStart(m[2].length, '0');
}

export async function GET(request: Request) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: request.headers });

  if (!user) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const secret = process.env.SPLITTER_INTAKE_SECRET;
  if (!secret) {
    return Response.json({ error: 'not configured' }, { status: 503 });
  }

  try {
    const upstream = await fetch(NEXT_ID_WEBHOOK, {
      headers: { 'x-intake-secret': secret },
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    if (!upstream.ok) {
      return Response.json({ error: 'upstream unavailable' }, { status: 503 });
    }

    const body: unknown = await upstream.json();
    const maxId =
      body !== null && typeof body === 'object' && 'maxId' in body
        ? (body as { maxId: unknown }).maxId
        : null;
    // maxId of null is n8n's honest "the table is empty" -- there is no
    // pattern to derive a next ID from, so the tool gets nothing rather than
    // an invented format.
    const nextId = typeof maxId === 'string' ? increment(maxId) : null;
    if (!nextId) {
      return Response.json({ error: 'no usable max id' }, { status: 503 });
    }

    return Response.json({ nextId });
  } catch {
    return Response.json({ error: 'upstream unavailable' }, { status: 503 });
  }
}
