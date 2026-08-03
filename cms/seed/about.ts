/**
 * Mike's About copy, verbatim as he sent it (#43).
 *
 * Stored plainly: straight apostrophes, an unspaced em dash, no full stop on the
 * closing line. lib/typeset.ts turns that into the finished typography at
 * render, which is the whole point -- this is the shape a person types.
 *
 * This is the seed, not the source of truth. Once it is in the database Mike
 * edits it at /admin and this file stops being read.
 */
export const aboutSeed = {
  paragraphs: [
    'Brandywine Coins was founded from a lifelong passion for numismatics and ' +
      'the belief that every coin has a story worth preserving. What began as a ' +
      'hobby has grown into an independent business dedicated to helping ' +
      'collectors buy, sell, and learn with confidence.',
    'Based in Wilmington, Delaware, we specialize in quality American and world ' +
      'coins, with a particular interest in historic European coinage, ' +
      "especially from Northern and Central Europe. You may also notice a " +
      "number of items that celebrate Delaware's colonial heritage and the " +
      'legacy of New Sweden, reflecting the history that helped shape our home ' +
      'state.',
    "Whether you're searching for a single collectible, building a specialized " +
      'collection, or looking to sell an inherited estate, every customer ' +
      'receives the same honest and respectful service.',
    'Because we carefully research every item and personally handle each order, ' +
      'response times may occasionally be a little slower than those of larger ' +
      'companies—but every customer receives our full attention and care.',
    "Whether you're a seasoned numismatist or purchasing your very first coin, " +
      "we're glad you're here. We look forward to helping you discover the " +
      'history, artistry, and enjoyment that make coin collecting such a ' +
      'rewarding hobby.',
  ],
  signoff: 'Thank you for visiting Brandywine Coins',
  // Provisional. #43 records this as Mike's to choose, against "the same honest
  // and respectful service". It is a field now, so he can change it himself.
  pullQuote: 'Every coin has a story worth preserving.',
};
