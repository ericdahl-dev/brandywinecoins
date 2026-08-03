#!/usr/bin/env python3
"""Derive the hero background plates from the supplied artwork.

Why this exists: the plates were cut by hand once and could not be reproduced,
so nobody could say what had been done to them. See issue #13.

What it corrects. Mike supplied the plates as separate crest-free renders. They
are not derivatives of the composition the live site serves -- the two are
different artwork -- but their vignette is much steeper than it. Measuring the
field as the median of the darker half of each ring, so coins and watermark do
not drag it:

    ring    live original      supplied plate     deficit
    r0.00   rgb(  2, 14, 30)   rgb(  2, 16, 27)   rgb( 0, -2,  3)
    r0.35   rgb(  1, 12, 27)   rgb(  0,  9, 20)   rgb( 1,  3,  7)
    r0.71   rgb(  1,  9, 22)   rgb(  0,  5, 13)   rgb( 1,  4,  9)
    r0.95   rgb(  1,  7, 17)   rgb(  1,  2,  6)   rgb( 0,  5, 11)

The centre agrees and the corners are crushed to a third, which is why the page
reads "too dark at the edges" while the crest area looks right. This script
fits a smooth per-channel radial offset that puts each plate's field ramp onto
the live original's, and prints the corrected ring medians so the CSS gradient can
be re-sampled from what actually ships -- the plate is composited over that
gradient, so the two have to agree or the frame line grows a visible step.

Usage:
    python3 tools/derive-plates.py            # writes public/art/*.webp
    python3 tools/derive-plates.py --dry-run  # measure and report only

Requires: pillow, numpy. The reference images are fetched from the live site.
"""
import argparse
import io
import sys
import urllib.request
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / 'assets' / 'backgrounds'
OUT = ROOT / 'public' / 'art'

# The live original, which is also assets/full-hero.png for the landscape one.
REFERENCE = {
    'desktop': 'https://brandywinecoins.net/assets/desktop.jpg',
    'mobile': 'https://brandywinecoins.net/assets/mobile.jpg',
}
PLATES = {
    'desktop': ('desktop_background.PNG', 'bg-desktop.webp', 'bg-desktop-mask.webp'),
    'mobile': ('mobile_background.PNG', 'bg-mobile.webp', 'bg-mobile-mask.webp'),
}

# Splitting the ghost watermark off the coins. Both live in the same plate, so
# one opacity governs both, and the setting the coins want leaves the ghost at a
# quarter of the strength the original gives it. The mask lets a second copy of
# the plate lift the ghost without touching the coins.
#
# It is derived, not drawn, from two blurred views of how each pixel departs
# from its local field. Magnitude separates the coins, whose texture is violent,
# from everything else -- median 5.25 to 6.0 over a coin against 1.75 over the
# ghost and 0.5 over clear sky. The positive part separates the ghost, which is
# a raised mark, from empty field -- median 1.12 against 0.38 on the top-centre
# strip. Both terms are needed: without the second the mask would keep the whole
# frame, and running the plate at full strength over field that only
# approximately matches the gradient reopens the step on the frame line.
ACTIVITY_BLUR = (90, 40)     # field estimate, then smoothing of both terms
MASK_KEEP, MASK_DROP = 2.5, 4.5      # activity: below KEEP all, above DROP none
GHOST_LO, GHOST_HI = 0.8, 1.8        # positive excess: the raised mark itself
MASK_GAMMA = 0.45
MASK_SCALE = 4                       # the mask is smooth; cover interpolates it back

RINGS = 24          # radial bins the gain is fitted over
FIELD_PCT = 45      # a ring's field is the darker FIELD_PCT% of its pixels
PASSES = 3          # refit against the measured result; one pass undershoots
LIFT_CLAMP = (-8.0, 24.0)   # per-channel, in 8-bit levels
SMOOTH = 3          # ring-radius moving average, in bins
QUALITY = 60        # fidelity is flat above this; 90 costs 3x the bytes for 0.1 L


def radius(shape):
    h, w = shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    return np.hypot((xx - w / 2) / (w / 2), (yy - h / 2) / (h / 2)) / np.sqrt(2)


def field_ramp(img, bins=RINGS):
    """Median colour of each ring's darker half -- the field, not the coins."""
    a = img.astype(float)
    d = radius(a.shape)
    lum = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]
    edges = np.linspace(0, 1, bins + 1)
    out = np.zeros((bins, 3))
    for i in range(bins):
        sel = (d >= edges[i]) & (d < edges[i + 1])
        if sel.sum() < 200:
            out[i] = out[i - 1] if i else 0
            continue
        px, l = a[sel], lum[sel]
        out[i] = np.median(px[l <= np.percentile(l, FIELD_PCT)], axis=0)
    return out


def smooth(ramp, k=SMOOTH):
    pad = np.pad(ramp, ((k, k), (0, 0)), mode='edge')
    ker = np.ones(2 * k + 1) / (2 * k + 1)
    return np.stack([np.convolve(pad[:, c], ker, 'valid') for c in range(3)], axis=1)


def expand(ramp, shape):
    """Per-ring values to a per-pixel map, linear between bins."""
    d = radius(shape)
    idx = np.clip((d * RINGS).astype(int), 0, RINGS - 1)
    frac = np.clip(d * RINGS - idx, 0, 1)[..., None]
    nxt = np.clip(idx + 1, 0, RINGS - 1)
    return ramp[idx] * (1 - frac) + ramp[nxt] * frac


def correct(plate, reference):
    """Add the radial offset that puts the plate's field on the reference's.

    Additive, not multiplicative, and that distinction is the whole correction.
    Whatever darkened these plates did not touch the coins -- measured against
    the live original the coins already land within a couple of levels, while
    the field is crushed to a third at the corners. A gain fitted to the field
    therefore multiplies the coins by up to 4.5x as well, which pushes their p99
    from 44 to 104. An offset moves the field by the deficit and leaves the
    coins' contrast where the artist drew it; at the corner the deficit is about
    rgb(0, 5, 11), which is nothing against a coin sitting at 50-200.

    Refit against the measured result rather than trusting one pass: rounding to
    8 bits at these levels loses enough that a single analytic offset undershoots.
    """
    target = smooth(field_ramp(np.asarray(
        Image.fromarray(reference).resize(plate.shape[1::-1], Image.LANCZOS))))
    lift = np.zeros((RINGS, 3))
    out = plate
    for _ in range(PASSES):
        lift = np.clip(lift + (target - smooth(field_ramp(out))), *LIFT_CLAMP)
        out = np.clip(plate.astype(float) + expand(lift, plate.shape), 0, 255)
        out = np.round(out).astype(np.uint8)
    return out, lift


def ghost_mask(img):
    """White with alpha = 1 away from the coins, 0 over them, soft in between."""
    a = img.astype(float)
    lum = 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]

    def blur(x, r, scale=1.0):
        return np.asarray(Image.fromarray(
            np.clip(x * scale, 0, 255).astype(np.uint8)
        ).filter(ImageFilter.GaussianBlur(r))).astype(float) / scale

    field = blur(lum, ACTIVITY_BLUR[0])
    excess = lum - field
    activity = blur(np.abs(excess), ACTIVITY_BLUR[1], scale=4.0)
    raised = blur(np.clip(excess, 0, None), ACTIVITY_BLUR[1], scale=8.0)
    keep = (np.clip((MASK_DROP - activity) / (MASK_DROP - MASK_KEEP), 0, 1)
            * np.clip((raised - GHOST_LO) / (GHOST_HI - GHOST_LO), 0, 1))
    keep = blur(keep, 24, scale=255.0)
    # The ramp leaves the ghost around a third of full weight. Gamma lifts the
    # middle without touching the zeros, so the mark strengthens and the field
    # the step depends on stays untouched.
    keep = keep ** MASK_GAMMA

    small = (a.shape[1] // MASK_SCALE, a.shape[0] // MASK_SCALE)
    alpha = Image.fromarray(np.round(keep * 255).astype(np.uint8)).resize(small, Image.LANCZOS)
    out = np.full((small[1], small[0], 4), 255, dtype=np.uint8)
    out[..., 3] = np.asarray(alpha)
    return out, keep


def hexes(ramp, at=(0.0, 0.35, 0.71, 1.0)):
    rows = []
    for t in at:
        c = ramp[min(int(t * RINGS), RINGS - 1)]
        rows.append((t, '#%02x%02x%02x' % tuple(int(round(v)) for v in c),
                     0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]))
    return rows


def run(dry_run):
    for key, (src, dst, maskdst) in PLATES.items():
        plate = np.asarray(Image.open(SOURCES / src).convert('RGB'))
        with urllib.request.urlopen(REFERENCE[key]) as fh:
            ref = np.asarray(Image.open(io.BytesIO(fh.read())).convert('RGB'))

        fixed, lift = correct(plate, ref)
        before, after = smooth(field_ramp(plate)), smooth(field_ramp(fixed))
        target = smooth(field_ramp(np.asarray(
            Image.fromarray(ref).resize(plate.shape[1::-1], Image.LANCZOS))))

        print(f'\n{key}: {src} -> {dst}   {plate.shape[1]}x{plate.shape[0]}')
        print(f'   {"ring":>5} {"before":>18} {"after":>18} {"target":>18}')
        for (t, hb, lb), (_, ha, la), (_, ht, lt) in zip(
                hexes(before), hexes(after), hexes(target)):
            print(f'   r{t:<4.2f} {hb} L{lb:6.2f} {ha} L{la:6.2f} {ht} L{lt:6.2f}')
        print(f'   lift {lift.min():+.1f}..{lift.max():+.1f} levels')

        buf = io.BytesIO()
        Image.fromarray(fixed).save(buf, 'WEBP', quality=QUALITY, method=6)
        # Sample the stops from the encoded file, not the array: the encoder
        # shifts these levels by about 1.5 L, and the CSS has to match what
        # ships or the frame line grows a step.
        shipped = smooth(field_ramp(np.asarray(
            Image.open(io.BytesIO(buf.getvalue())).convert('RGB'))))
        print(f'   {len(buf.getvalue()) / 1024:.0f} KB encoded')
        print('   CSS stops, sampled from the encoded file: '
              + ', '.join(h for _, h, _ in hexes(shipped)))

        mask, keep = ghost_mask(fixed)
        mbuf = io.BytesIO()
        Image.fromarray(mask).save(mbuf, 'WEBP', quality=90, method=6, exact=True)
        print(f'   ghost mask keeps {keep.mean() * 100:.0f}% of the frame by weight, '
              f'{len(mbuf.getvalue()) / 1024:.0f} KB')

        if dry_run:
            continue
        (OUT / dst).write_bytes(buf.getvalue())
        (OUT / maskdst).write_bytes(mbuf.getvalue())
        print(f'   wrote {OUT / dst} and {OUT / maskdst}')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--dry-run', action='store_true')
    sys.exit(run(**vars(ap.parse_args())))
