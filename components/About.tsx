import StarRule from './StarRule';
import s from './Sections.module.css';

/**
 * DRAFT COPY — written from the project brief, not by the owner.
 *
 * Mike should replace or edit this before launch: the New Sweden angle is his
 * and it should sound like him. Historical details used here are accurate
 * (New Sweden was founded in 1638 at Fort Christina, in present-day
 * Wilmington), but the voice is placeholder.
 */
export default function About() {
  return (
    <section id="about" className={s.section} tabIndex={-1}>
      <div className={s.inner}>
        <StarRule className={s.opener} />
        <h2 className={s.title}>About Us</h2>

        <div className={s.prose}>
          <p>
            Brandywine Coins is a coin dealer in Wilmington, Delaware, dealing in
            United States and world coinage across every grade and price point —
            from circulated type coins to certified modern issues.
          </p>
          <p>
            The name is local, and so is the history. In 1638 two Swedish ships
            landed at a rocky outcrop on the Christina River and founded Fort
            Christina, the first Swedish settlement in North America, on ground
            that is now Wilmington. New Sweden lasted seventeen years. Its
            traces — in place names, in land grants, in the families still here —
            lasted considerably longer.
          </p>
          <p>
            Coins keep that kind of record better than almost anything else.
            They are small, durable, dated, and they travel. Every one of them
            was carried by somebody, somewhere, for some reason.
          </p>
        </div>

        <div className={s.spear} aria-hidden="true">
          <svg viewBox="0 0 400 24" focusable="false">
            <polygon points="0,12 150,7 150,17" fill="currentColor" />
            <circle cx="158" cy="12" r="6" fill="currentColor" />
            <circle cx="242" cy="12" r="6" fill="currentColor" />
            <polygon points="400,12 250,7 250,17" fill="currentColor" />
          </svg>
        </div>

        <p className={s.pullQuote}>
          Seventeen years of New Sweden, and the river kept the name.
        </p>
      </div>
    </section>
  );
}
