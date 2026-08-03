import StarRule from './StarRule';
import s from './Sections.module.css';

/**
 * Mike's copy, set as he sent it (#43).
 *
 * Two things that look like typos and are not: no full stop after the closing
 * line, matching his note about the period after "patience", and the em dash in
 * "companies—but" is unspaced. Leave both alone.
 */
export default function About() {
  return (
    <section id="about" className={s.section} tabIndex={-1}>
      <div className={s.inner}>
        <StarRule className={s.opener} />
        <h2 className={s.title}>About Us</h2>

        <div className={s.prose}>
          <p>
            Brandywine Coins was founded from a lifelong passion for numismatics
            and the belief that every coin has a story worth preserving. What
            began as a hobby has grown into an independent business dedicated to
            helping collectors buy, sell, and learn with confidence.
          </p>
          <p>
            Based in Wilmington, Delaware, we specialize in quality American and
            world coins, with a particular interest in historic European coinage,
            especially from Northern and Central Europe. You may also notice a
            number of items that celebrate Delaware’s colonial heritage and the
            legacy of New Sweden, reflecting the history that helped shape our
            home state.
          </p>
          <p>
            Whether you’re searching for a single collectible, building a
            specialized collection, or looking to sell an inherited estate, every
            customer receives the same honest and respectful service.
          </p>
          <p>
            Because we carefully research every item and personally handle each
            order, response times may occasionally be a little slower than those
            of larger companies—but every customer receives our full attention
            and care.
          </p>
          <p>
            Whether you’re a seasoned numismatist or purchasing your very first
            coin, we’re glad you’re here. We look forward to helping you discover
            the history, artistry, and enjoyment that make coin collecting such a
            rewarding hobby.
          </p>
          {/* No full stop, deliberately. */}
          <p>Thank you for visiting Brandywine Coins</p>
        </div>

        <div className={s.spear} aria-hidden="true">
          <svg viewBox="0 0 400 24" focusable="false">
            <polygon points="0,12 150,7 150,17" fill="currentColor" />
            <circle cx="158" cy="12" r="6" fill="currentColor" />
            <circle cx="242" cy="12" r="6" fill="currentColor" />
            <polygon points="400,12 250,7 250,17" fill="currentColor" />
          </svg>
        </div>

        {/* Provisional: #43 says the pull quote is Mike's to choose, between this
            and "the same honest and respectful service". Taking the founding
            belief because it is the line the rest of the copy hangs off. Swap it
            when he answers. */}
        <p className={s.pullQuote}>Every coin has a story worth preserving.</p>
      </div>
    </section>
  );
}
