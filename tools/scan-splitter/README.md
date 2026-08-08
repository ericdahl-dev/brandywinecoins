# Scan Splitter

The coin-scan splitting tool Mike uses. `coin-splitter.html` is the source;
`./package.sh` generates the two forms that leave this repo:

- `public/tools/split.html` — the hosted copy, live at `/tools/split.html`
  on the site (unlinked; Mike bookmarks it). Generated, never hand-edited:
  `tests/splitter-hosted.spec.ts` fails CI if the source changes without
  this being regenerated.
- `Coin Scan Splitter.html` — the sendable standalone file, for offline use
  or when the site is unreachable.

Must be opened in **Safari** when the scans are HEIC — no other Mac browser
decodes them. Bump `VERSION` in the script on every build that leaves this
machine; it renders in the header, tab title and footer.

`splitter.test.mjs` runs guards against the **packaged** file (that
distinction has bitten once — a package shipped missing a fix that was in the
source):

    node splitter.test.mjs "Coin Scan Splitter.html" path/to/real-scan.png

Needs `playwright` (in this repo's node_modules) and ImageMagick.

The native-app future of this tool: `docs/scan-splitter-app-plan.md`.
