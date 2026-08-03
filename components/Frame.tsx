import s from './Frame.module.css';

/**
 * The ornamental double frame.
 *
 * Corners are concave: the arc's centre sits on the frame's own corner, so the
 * curve bulges inward. Fitting the source artwork's pixels confirms it -- at
 * y=30 the line is at x=41, which a concave arc predicts (41.2) and a convex
 * one does not (24.3).
 *
 * That cannot be drawn with border-radius on the ring itself, which only bends
 * the other way. Instead each corner is a square whose *inner* corner is
 * rounded to 100%, which puts the arc's centre exactly on the frame corner, and
 * the straight runs are separate elements inset by the radius. Keeping corners
 * as fixed squares also stops the arcs turning into ellipses on wide viewports,
 * which is what a stretched SVG frame would do.
 */
function Ring({ variant }: { variant: 'outer' | 'inner' }) {
  return (
    <div className={variant === 'outer' ? s.outer : s.inner}>
      <span className={s.top} />
      <span className={s.right} />
      <span className={s.bottom} />
      <span className={s.left} />
      <span className={s.cTL} />
      <span className={s.cTR} />
      <span className={s.cBR} />
      <span className={s.cBL} />
    </div>
  );
}

/**
 * Renders inside a positioned host that composes `host` from Frame.module.css,
 * which is where --frame-inset comes from. It cannot be declared on the frame
 * itself: whatever the frame is drawn around -- the hero's plate today -- is cut
 * to the same line and is a sibling, and siblings cannot inherit from it.
 *
 * Without the host class both rings resolve `inset: auto` and collapse, silently.
 * tests/plate.spec.ts guards it.
 */
export default function Frame() {
  return (
    <div className={s.frame} aria-hidden="true">
      <Ring variant="outer" />
      <Ring variant="inner" />
    </div>
  );
}
