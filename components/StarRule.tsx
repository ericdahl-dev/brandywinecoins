import s from './StarRule.module.css';

/**
 * The comp's divider: a gold star flanked by hairlines that fade outward.
 * Reused verbatim as the opener of every section below the hero, which is what
 * carries brand continuity down the page without repeating the ornate frame.
 */
export default function StarRule({ className }: { className?: string }) {
  return (
    <div className={[s.rule, className].filter(Boolean).join(' ')} aria-hidden="true">
      <span className={s.line} />
      <svg className={s.star} viewBox="0 0 24 24" focusable="false">
        <polygon
          points="12,2 14.6,9.2 22,9.2 16.1,13.8 18.3,21 12,16.6 5.7,21 7.9,13.8 2,9.2 9.4,9.2"
          fill="currentColor"
        />
      </svg>
      <span className={s.line} />
    </div>
  );
}
