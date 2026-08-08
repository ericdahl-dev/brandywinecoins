# Can a coin be straightened automatically?

Mike asked it plainly:

> "is there a way to avoid having to rotate every coin? i like the dial in
> feature but can it know to serve it upright, or is it just what it is"

Short answer today: it is what it is. Written down so nobody spends another
evening rediscovering why.

## What was tried

Bilateral symmetry search. Sweep every rotation of the coin, mirror it about
the vertical axis, and keep the angle where it best matches itself. Crowns,
shields, wreaths and monograms are symmetric, so the hope was that the axis of
best symmetry would be the upright one.

It runs in about 50 ms per coin on a 192px disc, needs no model and no network.
`scratchpad/straighten.py` is the prototype.

## Why it failed

It tracked rotation perfectly and still got every coin wrong.

Rotating a coin by a known 30° moved the detected axis by 30°, which looks like
success and is not: the search had locked onto the crop's own off-centring,
which rotates with the image. It found a stable axis on the horse-head token,
which has no bilateral symmetry at all. That was the tell.

Symmetry scores sat around 0.5 with margins under 0.07 — a weak preference,
not a real axis. Applied to the five test coins it made all five worse.

## Ground truth

Five coins, aligned by hand in the splitter to what a dealer calls correct:

| Coin | Correction |
|---|---|
| Sweden 2 Kronor 1938 | +20° |
| Nova Constellatio 40 | +2° |
| Sweden 5 öre 1909 | −34° |
| Iceland 1930 medal | +6° |
| $1 gaming token | −50° |

Mean correction 22°, spread −50° to +20°. Keep these: any future attempt should
be measured against them rather than judged by eye.

## What the cue actually is

Every one of those five is aligned so **the legend reads along the top arc and
the date or denomination sits at the bottom**. Mike is reading letters, not
shapes. His own observation about the token — "that horse head has things on
the border that indicate alignment" — points at the rim devices and the
`ONE DOLLAR GAMING TOKEN` / `NOT LEGAL TENDER` arcs.

Two reasons that is hard without something that can read:

- **Evenly spaced rim devices give rotational symmetry, not orientation.** Marks
  every 45° say the design repeats eight times. They cannot say which of the
  eight is up.
- **Coin legends are almost always capitals**, and capitals have roughly
  symmetric ink above and below the baseline. Unwrapping the rim into a strip is
  easy; deciding that strip is upright rather than upside down is not. Flip
  `NOT LEGAL TENDER` and the geometry barely moves.

## Attempt two: rim-band symmetry

Prompted by the ground truth itself: Mike aligns by the rim, so read only the
rim. Bin edge energy in the annulus 0.60R–0.90R by angle, find the axis about
which that 1-D profile is most mirror-symmetric, and put the heavier
semicircle (the longer legend) on top. `scratchpad/straighten2.py`.

Result: 0/5. One 5° near-miss with a margin of 0.002 — a coin toss that
landed, not a signal. The failure mode is instructive: rim detail energy on
these coins is nearly uniform, because lettering's edge energy is
indistinguishable from wreath, horseshoes and worn relief. The profile has no
shape to grip.

Two independent classical signals are now dead against the same ground truth.
The conclusion is no longer a suspicion: nothing that does not read letters
can do this job.

## What would actually work

A vision model that reads the coin. That belongs in the n8n pipeline, where a
few seconds and a few cents per coin are acceptable, and not in an offline tool
that has to be instant and free.

Worth trying only against the table above. A model that gets five out of five is
real. One that gets three and is confidently wrong on the other two is worse
than the dial, because a wrong angle has to be spotted before it can be fixed.

## The cheap fix in the meantime

Lay the coins roughly upright on the glass. The corrections above average 22°
because they were placed at random; placed deliberately they would be a few
degrees, which is two taps of the ±1° buttons rather than a slider drag.

Free, needs no code, and it is the only option available this week.
