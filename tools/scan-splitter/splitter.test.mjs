/**
 * Guards on the Coin Scan Splitter.
 *
 * These run against the PACKAGED file -- the one that actually gets sent --
 * not against a fresh build of the source. That distinction is the whole
 * reason this exists: a version shipped with the rotation corner-fill missing
 * because the source, the artifact and the package had drifted apart, and
 * every check at the time was pointed at the wrong one of the three.
 *
 *   node splitter.test.mjs [path-to-html] [path-to-scan]
 */
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const HTML = resolve(process.argv[2] ?? './Coin Scan Splitter.html');
const SCAN = resolve(process.argv[3] ?? './scan2.png');

const results = [];
function check(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(`${pass ? '  ok  ' : ' FAIL '} ${name}${detail ? `\n         ${detail}` : ''}`);
}

/** Pixel probe via ImageMagick, so the assertion does not trust the same
 *  canvas code that produced the file. */
function px(file, x, y) {
  return execFileSync('magick', [file, '-format', `%[pixel:p{${x},${y}}]`, 'info:'])
    .toString().trim();
}
function stat(file, expr) {
  return parseFloat(
    execFileSync('magick', [file, '-format', `%[fx:${expr}]`, 'info:']).toString().trim());
}

const work = mkdtempSync(join(tmpdir(), 'splitter-'));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });

/** Load the tool, feed it the scan, wait for the coins to appear. */
async function load() {
  await page.goto(`file://${HTML}`);
  await page.setInputFiles('#picker', SCAN);
  await page.waitForSelector('.coin', { timeout: 60_000 });
  await page.waitForFunction(
    () => /Found \d+/.test(document.getElementById('status').textContent),
    null, { timeout: 120_000 });
}

/** Click Download all, intercept the blob, write the zip out, unzip it. */
async function exportAll(tag) {
  await page.evaluate(() => {
    window.__zip = null;
    const orig = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (b) => {
      if (b && b.type === 'application/zip') window.__zip = b;
      return orig(b);
    };
    [...document.querySelectorAll('button')]
      .find((b) => /Download all/.test(b.textContent)).click();
  });
  await page.waitForFunction(() => window.__zip !== null, null, { timeout: 180_000 });
  const b64 = await page.evaluate(async () => {
    const buf = new Uint8Array(await window.__zip.arrayBuffer());
    let s = '';
    for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]);
    return btoa(s);
  });
  const zip = join(work, `${tag}.zip`);
  const out = join(work, tag);
  writeFileSync(zip, Buffer.from(b64, 'base64'));
  execFileSync('unzip', ['-qo', zip, '-d', out]);
  return { zip, out };
}

const names = async () =>
  execFileSync('unzip', ['-Z1', join(work, 'names.zip')]).toString().trim().split('\n');

try {
  // ---------------------------------------------------------------- 1. finds
  await load();
  const found = await page.locator('.coin').count();
  check('finds every coin on the bed and nothing else',
    found === 5, `found ${found}, expected 5 (four coins and a medal, one lid artifact ignored)`);

  // ------------------------------------------------------------ 2. measures
  const mm = await page.locator('.coin .caption b').allTextContents();
  // Strong-mask min-axis measurement (v9). The two Swedish coins have
  // published specs -- 31.0 and 27.0 mm -- and read ~0.7% lean on both,
  // consistent with the scanner's true optical dpi, not the mask.
  const want = [30.8, 39.1, 26.8, 35.6, 37.2];
  const got = mm.map((t) => parseFloat(t));
  const close = got.length === want.length &&
    got.every((v, i) => Math.abs(v - want[i]) <= 0.25);
  check('measures each coin against the stated scan resolution',
    close, `got ${got.join(', ')} mm; expected ${want.join(', ')} mm`);

  // ------------------------------------------------- 3. quarter turn is free
  const plain = await exportAll('plain');
  await page.evaluate(() => {
    const c = document.querySelectorAll('.coin')[0];
    const cw = [...c.querySelectorAll('.rot button')].find((b) => b.textContent === '↻');
    cw.click(); cw.click();       // 180
  });
  const turned = await exportAll('turned');
  const back = join(work, 'back.png');
  const a = join(turned.out, 'scan2-01-front.png');
  const b = join(plain.out, 'scan2-01-front.png');
  execFileSync('magick', [a, '-rotate', '180', back]);
  let diff = 'n/a';
  try {
    execFileSync('magick', ['compare', '-metric', 'AE', back, b, 'null:'],
      { stdio: ['ignore', 'ignore', 'pipe'] });
    diff = '0';
  } catch (e) { diff = (e.stderr || '').toString().trim(); }
  check('a quarter turn changes no pixel at all',
    diff.startsWith('0'), `pixels different after turning back: ${diff}`);

  // ------------------------------------------- 4. off-square fills the corner
  await load();
  await page.evaluate(() => {
    const s = document.querySelectorAll('.coin')[2].querySelector('input[type=range]');
    s.value = '-14';
    s.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const tilted = await exportAll('tilted');
  const tiltedFile = join(tilted.out, 'scan2-03-front.png');
  const corner = px(tiltedFile, 2, 2);
  const opaque = stat(tiltedFile, 'mean.a');
  check('an off-square angle leaves no transparent corner',
    !/,0\)$/.test(corner) && opaque === 1,
    `corner ${corner}, opaque fraction ${opaque} (transparency here flattens to black downstream)`);

  // ------------------------------------------- 5. warmth spares the paper
  await load();
  await page.evaluate(() => {
    const w = document.getElementById('warm');
    w.value = '100';
    w.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const warm = await exportAll('warm');
  const warmFile = join(warm.out, 'scan2-02-front.png');
  const coolFile = join(plain.out, 'scan2-02-front.png');
  const paperWarm = px(warmFile, 2, 2);
  const paperCool = px(coolFile, 2, 2);
  const coinWarmR = stat(warmFile, 'mean.r');
  const coinCoolR = stat(coolFile, 'mean.r');
  check('warmth leaves the paper alone and still warms the coin',
    paperWarm === paperCool && coinWarmR > coinCoolR,
    `paper ${paperCool} -> ${paperWarm}; mean red ${coinCoolR.toFixed(4)} -> ${coinWarmR.toFixed(4)}`);

  // ------------------------------------------------------------ 6. filenames
  await load();
  await page.evaluate(() => {
    const cells = [...document.querySelectorAll('.coin')];
    const set = (i, v) => {
      const f = cells[i].querySelector('input[type=text]');
      f.value = v;
      f.dispatchEvent(new Event('input', { bubbles: true }));
    };
    set(0, 'BWC-2026-0000074');
    set(1, 'BWC-2026-0000074');          // same id, other side
    set(2, 'bad/name:with*chars');
    [...cells[1].querySelectorAll('.side button')]
      .find((b) => b.textContent === 'Back').click();
  });
  await exportAll('names');
  const list = await names();
  check('the Inventory ID and side become the filename',
    list.includes('BWC-2026-0000074-front.png') && list.includes('BWC-2026-0000074-back.png'),
    list.join(', '));
  check('an unnamed coin still gets a file, and unsafe characters are stripped',
    list.includes('scan2-04-front.png') && list.some((n) => /^bad_name_with_chars-front\.png$/.test(n)),
    list.join(', '));

  // ------------------------------------------------------------ 7. self-contained
  const html = execFileSync('cat', [HTML]).toString();
  const remote = (html.match(/https?:\/\/[^"'\s)]+/g) || []);
  check('the page asks the network for nothing',
    remote.length === 0, `references: ${remote.join(', ')}`);
} finally {
  await browser.close();
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (!existsSync(work)) process.exit(failed.length ? 1 : 0);
  rmSync(work, { recursive: true, force: true });
  process.exit(failed.length ? 1 : 0);
}
