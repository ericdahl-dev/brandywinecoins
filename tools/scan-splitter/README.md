# Scan Splitter

The standalone coin-scan splitting tool Mike uses. `coin-splitter.html` is the
source (artifact-style, no doctype); the file actually sent to him is wrapped:

    { echo '<!doctype html>'
      echo '<html lang="en"><head><meta charset="utf-8">'
      echo '<meta name="viewport" content="width=device-width, initial-scale=1">'
      echo '</head><body style="margin:0">'
      cat coin-splitter.html
      echo '</body></html>'
    } > "Coin Scan Splitter.html"

Must be opened in **Safari** when the scans are HEIC — no other Mac browser
decodes them. Bump `VERSION` in the script on every build that leaves this
machine; it renders in the header, tab title and footer.

`splitter.test.mjs` runs guards against the **packaged** file (that
distinction has bitten once — a package shipped missing a fix that was in the
source):

    node splitter.test.mjs "Coin Scan Splitter.html" path/to/real-scan.png

Needs `playwright` (in this repo's node_modules) and ImageMagick.

The native-app future of this tool: `docs/scan-splitter-app-plan.md`.
