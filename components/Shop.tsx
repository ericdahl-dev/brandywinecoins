import ActionLink, { CONTACT_HREF } from './ActionLink';
import StarRule from './StarRule';
import s from './Sections.module.css';

export default function Shop() {
  return (
    <section id="shop" className={s.section}>
      <div className={s.inner}>
        <StarRule className={s.opener} />
        <h2 className={s.title}>Shop</h2>

        <div className={s.plate}>
          <div className={s.plateInner}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={s.plateMark} src="/art/emblem.svg" alt="" width={67} height={64} />

            {/* Deliberately smaller than the hero's line: the hero announces
                it, this confirms it. Two focal points would be neither. */}
            <p className={s.plateHeading}>The Collection Opens Soon</p>

            <p className={s.plateBody}>
              The storefront is being built now. Until it opens, we can tell you
              what is in the case and set pieces aside.
            </p>

            {/* Repeating the primary here is the point of the section: without
                it, the highest-intent visitor on the site clicks Shop, finds
                nothing to buy, and leaves with no way to say so. */}
            <ActionLink href={CONTACT_HREF} variant="primary">
              Get in Touch
            </ActionLink>
          </div>
        </div>
      </div>
    </section>
  );
}
