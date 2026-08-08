#!/bin/sh
# Packages the splitter source into the two forms that leave this repo:
#
#   public/tools/split.html          the hosted copy (#74 phase 1)
#   tools/scan-splitter/Coin Scan Splitter.html   the sendable file
#
# The hosted copy is generated, never edited: the one time a hand-packaged
# copy drifted from the source it cost an evening. `splitter-hosted.spec.ts`
# fails the build if this script was not re-run after a source change.
set -e
cd "$(dirname "$0")"

wrap() {
  printf '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">\n'
  printf '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
  printf '</head><body style="margin:0">\n'
  cat coin-splitter.html
  printf '</body></html>\n'
}

mkdir -p ../../public/tools
wrap > ../../public/tools/split.html
wrap > "Coin Scan Splitter.html"
echo "packaged: $(grep -o "VERSION = '[^']*'" coin-splitter.html)"
