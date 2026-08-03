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

Next.js 16 (App Router) · TypeScript · CSS Modules · Payload · Postgres · Playwright.

The package is ESM (`"type": "module"`). Payload loads `payload.config.ts`
through an ESM graph and `require` cannot cross it, so this is not optional.
That is why `next.config.ts` uses `import.meta.dirname` rather than `__dirname`.

```bash
npm run dev        # http://localhost:3000
npm test           # Playwright; reuses a running dev server
npm run build
npm run lint
npm run typecheck
```

## CMS

Payload runs inside this app rather than beside it, so there is no second service
to deploy and content is read in a server component rather than over the network.
Admin is at `/admin`.

`app/` is split into two route groups that never meet:

```
app/
  favicon.ico          root segment -- Next requires favicon here, not in a group
  (frontend)/          the site: layout, page, globals.css, icons, OG image
  (payload)/           admin panel, REST and GraphQL
cms/
  collections/         Users
  migrations/          schema, by reviewed file rather than inferred on boot
  payload-types.ts     generated
```

Two environment variables, both required. See `.env.example`.

```bash
DATABASE_URI      # Postgres connection string
PAYLOAD_SECRET    # any long random string; rotating it invalidates sessions
```

A local database for development:

```bash
docker run -d --name bw-payload-pg \
  -e POSTGRES_USER=payload -e POSTGRES_PASSWORD=devpass -e POSTGRES_DB=brandywine \
  -p 5433:5432 postgres:17-alpine
```

Schema arrives by migration, never by push. Both `npm run build` and `npm start`
run `payload migrate` first, and CI runs a Postgres service for the same reason.

**The build needs the database, not just the runtime.** `/` is prerendered with
the About copy baked in, so `next build` reads the `about` global. A build
against an unmigrated database fails with `relation "about" does not exist`,
which is why `migrate` is part of the build script rather than a step somebody
remembers. If a deploy target cannot reach Postgres at build time, the fix is to
render `/` dynamically rather than to drop the migration.

After changing a collection:

```bash
npm run migrate:create <name>
npm run migrate            # migrate:status to see what has run
npm run generate:types     # regenerate cms/payload-types.ts
npm run generate:importmap # after adding any custom admin component
```

There is no rich text editor, deliberately. The copy this manages is prose whose
exact characters matter — an unspaced em dash, curly apostrophes, a closing line
with no full stop, and the thin spaces and word joiners that typeset the dash. A
rich text editor stores a node tree and is free to normalise those. Plain text
fields store what was typed.

Nothing about the artwork is editable. The wordmark and emblem are curve traces
of the supplied alpha, and the background plates are derived by
`tools/derive-plates.py` against gradient stops in `Hero.module.css`. There is no
upload collection to invite otherwise.

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
  outlines.
- **The wordmark is traced from the artwork, not re-set in a font.** Re-setting
  it in Cinzel was still a guess, and measuring proves the guess wrong: fitting
  Cinzel's outlines to each glyph's ink box in `wordmark-alpha.png` needs a
  horizontal squeeze of ~0.76 on `BRANDYWINE` and ~0.90 on `COINS`, and the
  artwork lifts the middle small caps 8px clear of the cap baseline (caps sit at
  y=108, small caps at y=100) — an alignment no plain type setting reproduces.
  Read together those numbers say the source is Trajan Pro, whose lowercase are
  ~74% small caps (matching the measured 77/104), with line 1 stretched ~1.2×
  vertically by whoever drew it. `wordmark.svg` is therefore a curve trace of
  the supplied alpha — upsampled 4× and lightly blurred first so the fitter sees
  a smooth edge rather than a 748px staircase — which reproduces the letterforms,
  the tracking and that raised baseline exactly (IoU 0.987 against the source),
  and stays crisp at any size. Its gradients are sampled from the artwork's own
  scanline means rather than eyeballed; the outermost few scanlines are dropped
  because they are almost all antialiased edge and would paint a false dark rim.
- **The coins had no alpha.** `coin-left.png` / `coin-right.png` were opaque
  rectangular crops with the navy baked in, which the comp hid behind stacked
  `mask-image` + `mask-composite` gradients. They are now genuine cutouts, so
  the masking hack is gone and they can sit on any background. They are cut from
  the newer `homepage-desktop.png` artwork rather than the original JPEG — same
  coins, but warmer and with the engraving detail intact. The ornamental frame
  line is painted across each coin in that source; it falls in the sliver that
  bleeds off-canvas, so it is trimmed rather than inpainted.
- **The emblem is traced too, except its rings.** It had been reconstructed from
  primitives, which got four things measurably wrong: 13 stars where the artwork
  has 12 (evenly spaced at 30.0°, measured sd 1.1°, starting at twelve o'clock —
  13 came from the comp's JS, not the art); the inner ring at r=78 where the
  artwork puts it at 88.7 (outer ring = 100); a Cinzel B at 57×67 where the
  artwork's is 67×84, a much taller and narrower letter; and the trademark
  parked on the ring at r=94.5 when the artwork sets it clear of the ring at
  r=127, which is why the ™ looked wrong. Stars, B and ™ are now traced. The two
  rings are *not* — a 380px trace of a circle wanders 1.2% of its radius, and a
  lumpy ring is the one thing on this mark the eye catches, so they are redrawn
  as real circles at the traced radii. `logo-emblem-alpha.png` is a 1:1 crop of
  `full-hero.png` (verified: zero pixel difference at origin 590,52) but its
  canvas clips the last two rows off the bottom of the disc, so the annulus is
  closed analytically from the fitted circle before tracing.
- **`ghost-watermark.png` was dropped.** It was the emblem, ghosted, so the site
  reuses the emblem SVG at low opacity instead.

### Deriving the background plates

`tools/derive-plates.py` rebuilds `public/art/bg-desktop.webp` and
`bg-mobile.webp` from the artwork Mike supplied in `assets/backgrounds/`. Run it
rather than editing the plates by hand -- doing it by hand once is what produced
issue #13, where nobody could say what had been done to them.

The plates are separate crest-free renders, not derivatives of the composition
the live site serves, but their vignette is much steeper than it. Measuring the
field as the median of the darker half of each ring, so coins and watermark do
not drag it, the corners sit at a third of the original's brightness while the
centre agrees. The script fits a smooth per-channel radial *offset* -- not a
gain -- that puts each plate's field ramp onto the live original's.

Additive is the whole point. Whatever darkened these plates left the coins
alone: they already land within a couple of levels of the original. A gain
fitted to the field multiplies the coins by up to 4.5x as well, which pushes
their p99 from 44 to 104. An offset moves the field by its deficit -- about
rgb(0, 5, 11) at the corner, nothing against a coin sitting at 50-200 -- and
leaves the coins' contrast where the artist drew it.

It also emits a mask per plate. The ghost watermark and the coins live in the
same image, so one opacity governs both, and the setting the coins want leaves
the ghost at a quarter of the strength the original gives it. The mask lets a
second copy of the plate lift the ghost without touching the coins, and it is
derived rather than drawn: blurring how far each pixel departs from its local
field separates them cleanly. Magnitude isolates the coins, whose texture is
violent; the positive part isolates the ghost, which is a raised mark, from
empty field. Both terms are needed -- with only the first the mask keeps the
whole frame, and running the plate at full strength over field that merely
approximates the gradient reopens the step on the frame line.

The script prints the corrected ring medians sampled from the *encoded* file.
Those are the numbers the gradient in `Hero.module.css` has to carry: the plate
is composited over that gradient, so if the two disagree the margin outside the
frame reads as a different colour from the field inside it. `tests/field.spec.ts`
asserts both the brightness band and the absence of that step, on rendered
pixels.

### Icons and the link preview

`tools/derive-icons.mjs` writes `app/icon.svg`, `app/apple-icon.png`,
`app/favicon.ico` and `app/opengraph-image.png`, all from the mark and the site
itself. Run it rather than hand-placing any of them: the scaffold favicon
shipped with the initial rebuild and sat there unnoticed, Vercel's triangle on a
site whose whole argument is a hand-traced brand mark.

The icon is the emblem clipped to its disc, which drops the trademark -- it is
unreadable at 16px and hangs outside the circle. The Apple icon is flattened
onto the ink navy because iOS ignores alpha and would otherwise composite onto
white. The preview image is a screenshot of the running site rather than a
hand-built composition, so it cannot fall out of step with the page; it needs a
server, and passing a URL argument points it at one other than localhost.

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
- **Small caps are real, and the display face is Cinzel.** The comp specifies
  Cormorant Garamond and fakes small caps by shrinking letters mid-word
  (`W<span style="font-size:21px">ILMINGTON</span>`), which fragments the
  accessible name and breaks find-in-page and copy-paste. The artwork is Trajan;
  those per-letter spans are imitating Trajan's small caps on lowercase
  codepoints. Display and UI type is set in Cinzel, a Trajan revival that carries
  the same small caps for free; prose stays Cormorant Garamond.
- **No `white-space: nowrap`.** It does not prevent overflow, it guarantees it.
- **The star ring is static.** The comp generated its 13 stars in
  `componentDidMount`, so the logo did not render without JS.

## Copy

The `#about` copy in `components/About.tsx` is Mike's, set as he sent it. Two
things in it look like typos and are not: there is no full stop after the closing
line, and the em dash in "companies—but" is unspaced. Both are deliberate.

The pull quote below it is still provisional. It is his to choose, between the
line used now and "the same honest and respectful service".

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
