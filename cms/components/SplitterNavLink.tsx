import React from 'react';

/**
 * The one link in the admin nav that is not a collection: the Scan Splitter,
 * which lives at /admin/tools/split behind the same login (#81).
 *
 * A plain anchor, deliberately. The splitter is a self-contained HTML page,
 * not an admin SPA view, so a full navigation is correct -- and `nav__link`
 * is the class Payload's own nav items wear, which keeps it looking native
 * without importing anything from the admin UI package.
 */
export const SplitterNavLink: React.FC = () => (
  // The lint rule assumes the destination is a page, where <Link /> gives a
  // client-side transition. This destination is a route handler returning raw
  // HTML; a client-side transition is precisely the wrong behaviour, and a
  // full navigation is the point.
  // eslint-disable-next-line @next/next/no-html-link-for-pages
  <a className="nav__link" href="/admin/tools/split">
    Scan Splitter
  </a>
);
