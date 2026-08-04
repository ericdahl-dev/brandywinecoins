import { BUSINESS, CONTACT_HREF } from '../lib/business';
import s from './Footer.module.css';

/**
 * The page used to end about 110px after the Shop card, on bare navy, with the
 * contact address present only inside a `mailto:` href.
 *
 * The address is rendered as text *and* wrapped in the link, rather than one or
 * the other. A visitor whose browser has a mail client bound gets the link they
 * expect; a visitor whose browser has none can still read it, select it, and
 * copy it. Before, that second visitor clicked the primary action and got
 * nothing, with no other path to Mike and no symptom for anyone to notice.
 *
 * Nothing here is invented. There is no premises, so no street address and no
 * opening hours -- the same discipline as the structured data, and for the same
 * reason: fabricated contact details are worse than absent ones.
 */
export default function Footer() {
  return (
    <footer className={s.footer}>
      <div className={s.inner}>
        <a className={s.email} href={CONTACT_HREF}>
          {BUSINESS.email}
        </a>

        {/* The year is read at request time, not baked in. The page is already
            `force-dynamic`, so this costs nothing -- and a footer still reading
            2026 in 2028 is the clearest signal a site has been abandoned, which
            is the opposite of what a dealer's footer is for. */}
        <p className={s.legal}>
          © {new Date().getFullYear()} {BUSINESS.name} · {BUSINESS.locality},{' '}
          {BUSINESS.region}
        </p>
      </div>
    </footer>
  );
}
