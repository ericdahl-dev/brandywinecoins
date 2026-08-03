import CrestNav from './CrestNav';
import Frame from './Frame';
import StarRule from './StarRule';
import s from './Hero.module.css';

export default function Hero() {
  return (
    <section className={s.hero}>
      <div className={s.plate} aria-hidden="true" />
      <Frame />

      <div className={s.crest}>
        {/* 208x200, not square: the trademark sits outside the ring. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={s.emblem} src="/art/emblem.svg" alt="" width={208} height={200} />

        <h1 className={s.wordmarkWrap}>
          {/* Traced to outlines: renders identically with no webfont, and as an
              <img> its gradient ids cannot collide with a second instance. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={s.wordmark}
            src="/art/wordmark.svg"
            alt="Brandywine Coins"
            width={748}
            height={192}
          />
        </h1>

        {/* Title case, not caps: small-cap glyphs only replace lowercase letters. */}
        <p className={s.locale}>Wilmington, Delaware</p>

        <StarRule className={s.rule} />

        <h2 className={s.headline}>Our Collection Opens Soon</h2>

        <StarRule className={s.rule} />

        <p className={s.patience}>Thank you for your patience.</p>

        <CrestNav className={s.nav} />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={s.laurel}
          src="/art/laurel-delaware.png"
          alt=""
          width={370}
          height={90}
        />
      </div>
    </section>
  );
}
