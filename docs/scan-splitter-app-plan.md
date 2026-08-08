# Scan Splitter, the Mac app — plan

Not started. This is the plan, written the night the idea surfaced, so that
when it gets built the decisions are already made and the traps already
flagged.

## Where this came from

The browser Scan Splitter got its first real use on the evening of Aug 7 2026:
Mike put five coins on his flatbed, dropped the scan in, and went from "let me
test this" to "this is pretty tits" inside an hour. Eight versions shipped into
the iMessage thread that night as he tested. What friction remains is exactly
one hop: he scans in Image Capture, then drags the file into the page.

Eric's idea, verbatim: "maybe the scan splitter can directly access the
scanner." Mike's translation, which is the requirement: "so it would just scan
and split at the same time?"

No browser can do this. There is no web API for scanners; TWAIN and
ImageCaptureCore are OS-level. The one-click version requires native code.
Eric has an Apple developer account, so signing and notarization — the reason
native was previously avoided — are solved.

Why this beats the watch-folder alternative: a folder pipeline (Image Capture
scans into a synced folder, n8n splits server-side) automates the *cutting*,
but the evening proved the human part is the *labeling* — Inventory ID,
front/back, the rotation dial. The app keeps capture and labeling in one
sitting, coin in hand. The folder pipeline remains the right shape for bulk
server-side processing later; the two do not compete.

## The one architecture decision that matters: wrap, don't rewrite

v1 to v8 in two hours was possible because the UI is HTML and shipping a fix
meant "save this file to your desktop." A SwiftUI rewrite converts every tweak
into build → sign → notarize → distribute → "replace the app." That loop
murders the iteration speed that made the tool good in the first place.

So the app is a **thin native shell around the existing page**:

- `WKWebView` hosting the splitter — pointed at the **hosted copy** once #74
  lands (UI updates then ship by site deploy, and Sparkle only matters for
  native scanner code), with the bundled `coin-splitter.html` as the offline
  fallback
- a JS↔Swift bridge (`WKScriptMessageHandler`) exposing only what a browser
  cannot do
- native surface kept deliberately tiny: scanner control and file I/O, nothing
  else until something forces it

Detection, rotation, warmth masking, ID/side labeling, the manifest — all stay
as the field-tested JS. The page detects the bridge's presence and shows a
Scan button; the same HTML file keeps working in plain Safari without it, so
the browser version never dies and remains the fallback.

## Native surface, in build order

1. **Shell.** Xcode project, WKWebView loading the bundled HTML, bridge
   handshake (`window.webkit.messageHandlers`). The page shows "Scan" when the
   bridge answers. Ship this first — it is testable with zero hardware.
2. **Scanner.** `ICDeviceBrowser` to find scanners, `ICScannerDevice` for
   overview scan → full scan at the configured dpi. Result lands in the page
   exactly as if a file had been dropped — same code path after intake, no
   fork in behavior. Hardware required (see traps).
3. **File I/O.** Save the zip (or loose crops + manifest) to a chosen folder
   with no download dance. If that folder is Drive-synced, the n8n pipeline
   picks up from there and the app never needs to know Airtable exists.
4. **Updates.** Sparkle, or a dumb version-check against a URL Eric controls.
   The in-page version stamp (v8 pattern) stays — an evening was already lost
   to "which file do you have open."
5. **Later, only if earned:** direct n8n webhook post instead of the folder;
   scanner settings presets ("raw coins 600dpi" / "documents").

## Traps, known in advance

- **The only native part is the only untestable part.** There is no simulator
  for ImageCaptureCore; it needs glass and a lamp. Do not let Mike become the
  remote test bench for scanner quirks over iMessage. Fix: ask his scanner
  model (a natural question anyway) and buy the same or same-family flatbed —
  sub-$100 for the class he is using — before writing step 2.
- **Slabs are out of scope.** Tested Aug 7: NGC and ICG slabs blur because the
  plastic lifts the coin off the glass and out of the scanner's focal plane.
  Slabbed coins get photographed; the app should not try to fix optics.
- **Resolution default.** Mike was testing 300/400/600/1200 and has not
  picked; Eric suggested 600 as the detail/file-size balance. Set the app's
  default to whatever he lands on; keep 1200 available for the coins where
  "shows everything" is the point.
- **The image-integrity line.** Coin pixels are never altered; backgrounds are
  fair game (Mike, explicitly, Aug 7). The app inherits the splitter's
  behavior: crop, lossless quarter turns, corner fill from the bed color,
  warmth masked to the coin as white balance. Nothing new touches the coin.
- **Iteration discipline.** If a change can be made in the HTML, make it in
  the HTML. The moment logic starts migrating into Swift because it is
  "cleaner," the update loop is dead and the browser fallback rots.

## What it is not

Not a catalogue app, not an Airtable client, not a photo editor, and not a
replacement for the phone camera on slabbed or high-inclusion coins Mike
prefers to shoot. It is the scanner, the split, and the labeling, in one
sitting.

## Preconditions

- The weekend conversation (DNS cutover, which is gated by the rate limit,
  #73) comes first; this project does not jump that queue.
- The labeling question — does ID/side/rotation live in this app or in the
  Airtable intake queue — gets settled by how Mike actually works a real
  batch, which the weekend's first full tray will show.
- Scanner model known, matching hardware on Eric's desk.

## Success test

Mike puts a tray of raw coins on the glass, presses one button in the app,
types IDs while the next tray scans, and never opens Image Capture or drags a
file. If after a real batch he still opens Image Capture for anything, step 2
is not done.
