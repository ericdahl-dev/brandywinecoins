# Brandywine Coins

Landing page for Brandywine Coins, a coin dealer in Wilmington, Delaware.

Phase 1 is a responsive landing page with three working actions. The storefront,
payment processing and any CMS are explicitly out of scope.

## Why this is a rebuild rather than an edit

The previous site was a single flat background image (separate `mobile.jpg` and
`desktop.jpg`) plus one `mailto:` link. It had no `<title>`, no meta
description, no structured data, and `alt=""` on the images carrying all the
content — so to a crawler or a screen reader the page was blank. There was no
markup for a button to attach to, which is why adding one kept failing.

## Stack

Next.js 16 (App Router) · TypeScript · CSS Modules · Playwright.

```bash
npm run dev        # http://localhost:3000
npm test           # Playwright; reuses a running dev server
npm run build
npm run lint
npm run typecheck
```

## Deployment

Coolify, `nixpacks` build pack, port 3000 — matching the other Next.js apps on
the same host. Deliberately not a static export: keeping a Node server leaves
API routes and server actions available for Phase 2.

Staging is `bwcoins.ericdahl.dev` (A record → `138.201.202.52`, same as the
other ger3 apps). The production domain `brandywinecoins.net` stays on Hostinger
for now — its DNS and email are bundled there, so moving it needs care not to
break `info@brandywinecoins.net`.

## Artwork

`assets/` holds the original sliced artwork, `assets/derived/` the files this
site actually uses, `public/art/` the deployed copy.

Three things in the source art were fixed rather than worked around:

- **`wordmark.svg` and `emblem.svg` were not vectors.** Their letterforms were
  `<text>` elements depending on Cormorant Garamond. An SVG loaded through
  `<img>` has no access to the parent document's webfonts, so both would have
  silently fallen back to Times New Roman for most visitors. They are now real
  outlines. Note Google serves Cormorant Garamond as a *variable* font whose
  default instance is Light 300 — outlines must come from an instance pinned to
  `wght=600`, or the letterforms are too light and the advances are wrong.
- **The coins had no alpha.** `coin-left.png` / `coin-right.png` were opaque
  rectangular crops with the navy baked in, which the comp hid behind stacked
  `mask-image` + `mask-composite` gradients. They are now genuine cutouts, so
  the masking hack is gone and they can sit on any background.
- **`ghost-watermark.png` was dropped.** It was the emblem, ghosted, so the site
  reuses the emblem SVG at low opacity instead.

Art references are centralised in `public/art/` so an illustrator's redraw can
be swapped in without touching component code.

## Where this departs from the comp

`design/Hero Rebuild.dc.html` is the approved comp and the visual reference, but
it is not authoritative everywhere:

- **Corners are rounded, not chamfered.** The comp uses `clip-path` polygons
  with notched corners; the original artwork turns its frame corners on a
  radius, and the original site's own button used `border-radius: 10px`. The
  build follows the artwork. This also lets buttons and plates use real borders
  and unclipped focus rings.
- **Small caps are real.** The comp fakes them by shrinking letters mid-word
  (`W<span style="font-size:21px">ILMINGTON</span>`), which fragments the
  accessible name and breaks find-in-page and copy-paste. Cormorant SC is a
  separate family from Cormorant Garamond and is loaded explicitly.
- **No `white-space: nowrap`.** It does not prevent overflow, it guarantees it.
- **The star ring is static.** The comp generated its 13 stars in
  `componentDidMount`, so the logo did not render without JS.

## Copy

**The `#about` copy in `components/About.tsx` is a draft** written from the
project brief, not by the owner. The New Sweden history in it is accurate, but
the voice is placeholder and should be replaced before launch.

## Tests

Playwright covers what broke the old site and what must hold for the new one: no
horizontal scroll from 320px up, headline never clipped, decoration never
colliding with content, 44px touch targets, heading structure, the three actions
and their targets, alt-text handling, and page metadata.

Note `globals.css` deliberately omits `overflow-x: hidden` on `html`/`body`.
That hides horizontal overflow rather than preventing it and would make the
layout tests pass while blind; bleed is clipped at the decor layer instead.

`design/` holds the original comps and the design tool's runtime, kept for
provenance. It is excluded from linting and is not served.
