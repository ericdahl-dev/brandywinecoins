import config from '@payload-config';
import { getPayload } from 'payload';

import { typeset } from '../lib/typeset';
import StarRule from './StarRule';
import s from './Sections.module.css';

/**
 * Mike's copy, edited at /admin and stored as plain text.
 *
 * The typography is applied here rather than kept in the database:
 * lib/typeset.ts curls the apostrophes and spaces the em dash, so what he types
 * is ordinary prose and what ships is set properly. That is also why the two
 * oddities #43 recorded no longer need protecting in this file -- a hand-spaced
 * dash and a straight apostrophe now render the same as the finished forms.
 *
 * The heading stays here. It is Cinzel, whose small caps only replace lowercase
 * codepoints, so an all-caps value from a text field would silently break it,
 * and there is no reason for it to change.
 */
export default async function About() {
  const payload = await getPayload({ config });
  const about = await payload.findGlobal({ slug: 'about' });

  // One field, split on blank lines. The paragraphs are prose, not items:
  // nothing reads them individually, and five separate boxes is a worse surface
  // to write five paragraphs in than one is.
  const paragraphs = (about.body ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section id="about" className={s.section} tabIndex={-1}>
      <div className={s.inner}>
        <StarRule className={s.opener} />
        <h2 className={s.title}>About Us</h2>

        <div className={s.prose}>
          {paragraphs.map((text, i) => (
            <p key={i}>{typeset(text)}</p>
          ))}
          {about.signoff ? <p>{typeset(about.signoff)}</p> : null}
        </div>

        <div className={s.spear} aria-hidden="true">
          <svg viewBox="0 0 400 24" focusable="false">
            <polygon points="0,12 150,7 150,17" fill="currentColor" />
            <circle cx="158" cy="12" r="6" fill="currentColor" />
            <circle cx="242" cy="12" r="6" fill="currentColor" />
            <polygon points="400,12 250,7 250,17" fill="currentColor" />
          </svg>
        </div>

        {about.pullQuote ? <p className={s.pullQuote}>{typeset(about.pullQuote)}</p> : null}
      </div>
    </section>
  );
}
