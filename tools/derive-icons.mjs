/**
 * Derive the favicon, the app icon and the link-preview image from the site
 * itself, so none of them can drift from the mark the way the scaffold favicon
 * did -- it shipped with the initial rebuild and sat there, Vercel's triangle,
 * on a site whose whole argument is a hand-traced brand mark.
 *
 *   app/icon.svg            the emblem, clipped to its disc (drops the ™, which
 *                           is unreadable at 16px and hangs outside the circle)
 *   app/apple-icon.png      180x180, flattened onto the ink navy -- iOS ignores
 *                           alpha and would otherwise composite onto white
 *   app/favicon.ico         16/32/48, for the browsers that still ask for it
 *   app/opengraph-image.png 1200x630, screenshotted from the running site
 *
 * The preview image is a screenshot rather than a hand-built composition on
 * purpose: it cannot fall out of step with the page, and the hero's own height
 * rules compose it sensibly at 630px tall.
 *
 * Usage:  node tools/derive-icons.mjs [http://localhost:3000]
 */
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = process.argv[2] ?? 'http://localhost:3000';
const INK = '#03070f';

function discIcon() {
  const svg = readFileSync(join(ROOT, 'public/art/emblem.svg'), 'utf8');
  const body = svg.slice(svg.indexOf('</defs>') + '</defs>'.length, svg.lastIndexOf('</svg>'));
  const defs = svg.slice(svg.indexOf('<defs>') + '<defs>'.length, svg.indexOf('</defs>'));
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" ' +
    'aria-label="Brandywine Coins">' +
    `<defs>${defs}<clipPath id="disc"><circle cx="100" cy="100" r="100"/></clipPath></defs>` +
    `<g clip-path="url(#disc)">${body}</g></svg>`
  );
}

/** ICO is a 6-byte header, a 16-byte directory entry per size, then the PNGs. */
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const dir = Buffer.alloc(16 * images.length);
  let offset = header.length + dir.length;
  images.forEach(({ size, png }, i) => {
    const e = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, e);
    dir.writeUInt8(size >= 256 ? 0 : size, e + 1);
    dir.writeUInt16LE(1, e + 4);
    dir.writeUInt16LE(32, e + 6);
    dir.writeUInt32LE(png.length, e + 8);
    dir.writeUInt32LE(offset, e + 12);
    offset += png.length;
  });
  return Buffer.concat([header, dir, ...images.map((i) => i.png)]);
}

const iconSvg = discIcon();
writeFileSync(join(ROOT, 'app/icon.svg'), `${iconSvg}\n`);
console.log(`app/icon.svg           ${iconSvg.length} bytes`);

const browser = await chromium.launch();

async function render(size, background) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<style>html,body{margin:0;background:${background}}svg{display:block;width:${size}px;height:${size}px}</style>${iconSvg}`,
  );
  const png = await page.screenshot({ omitBackground: background === 'transparent' });
  await page.close();
  return png;
}

writeFileSync(join(ROOT, 'app/apple-icon.png'), await render(180, INK));
console.log('app/apple-icon.png     180x180 on ink navy');

const sizes = [16, 32, 48];
const images = [];
for (const size of sizes) images.push({ size, png: await render(size, 'transparent') });
writeFileSync(join(ROOT, 'app/favicon.ico'), ico(images));
console.log(`app/favicon.ico        ${sizes.join('/')}`);

const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
const response = await page.goto(SITE, { waitUntil: 'networkidle' });
if (!response?.ok()) throw new Error(`${SITE} answered ${response?.status()}`);
await page.addStyleTag({
  content:
    // The dev server's indicator would otherwise be baked into the card.
    'nextjs-portal{display:none!important}' +
    // A 1.9:1 card is shallower than any real viewport, and the hero's height
    // rules are tuned to leave room to scroll rather than to fit the whole
    // crest. Pin the crest so the card holds all of it, laurel included.
    'section>div:has(h1){--crest-w:366px!important}',
});
await page.screenshot({ path: join(ROOT, 'app/opengraph-image.png') });
console.log(`app/opengraph-image.png 1200x630 from ${SITE}`);
await browser.close();
