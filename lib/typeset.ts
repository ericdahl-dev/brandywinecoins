/**
 * Typesetting for prose that arrives from the CMS as plain text.
 *
 * The alternative was storing the finished characters, and it does not survive
 * contact with a person typing into a textarea. Mike sends copy with straight
 * apostrophes; the page is set in Cormorant Garamond and wants curly ones. He
 * writes an unspaced em dash, which is correct US style but reads cramped at the
 * size this ships and needs thin spaces and word joiners around it to sit right
 * and to stop the dash starting a line (#43). None of that is his job.
 *
 * So the database holds what was typed and this applies the typography on the
 * way out. It also settles an ambiguity #43 could not: whether the source copy
 * had curly apostrophes or straight ones stops mattering, because both render
 * the same, and so does a dash he spaced by hand.
 */

/** U+2060 word joiner: forbids a line break at this position. */
const WJ = '⁠';
/** U+2009 thin space. */
const THIN = ' ';
/** U+2014 em dash. */
const EM = '—';

/**
 * An em dash may break on either side, and at desktop widths it takes the left
 * one, leaving a line that opens with the dash. A thin space is itself a break
 * opportunity, so it cannot simply be dropped in: word joiners pin the left one.
 * The right stays breakable, because a line may legitimately end on a dash.
 */
const DASH = `${WJ}${THIN}${WJ}${EM}${THIN}`;

/** Whatever already surrounds a dash: ordinary space, thin space, word joiner. */
const AROUND_DASH = new RegExp(`[\\s${WJ}${THIN}]*${EM}[\\s${WJ}${THIN}]*`, 'gu');

export function typeset(input: string): string {
  return (
    input
      // Straight apostrophe between letters -> curly. Contractions and
      // possessives; a leading quote is a different mark and is left alone.
      .replace(/(\p{L})'(\p{L})/gu, '$1’$2')
      // Plural possessive: "the collectors' choice".
      .replace(/(\p{L})'(?=\s|$)/gu, '$1’')
      // Strip whatever is around the dash, then apply one treatment. Normalising
      // first is what makes this idempotent and what makes a hand-spaced dash
      // come out identical to an unspaced one, rather than doubly spaced.
      .replace(AROUND_DASH, DASH)
  );
}

/** Convenience for a list of paragraphs. */
export function typesetAll(paragraphs: readonly string[]): string[] {
  return paragraphs.map(typeset);
}
