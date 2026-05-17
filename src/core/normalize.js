// Japanese normalization. Returns the input unchanged unless the toggle is on.
//
// Single transformation: Unicode NFKC compatibility decomposition + canonical
// composition. NFKC is exactly the canonical "Japanese search input
// normalization" pipeline:
//   - Full-width ASCII letters/digits (Ａ-Ｚ, ａ-ｚ, ０-９) → half-width (A-Z, a-z, 0-9)
//   - Full-width punctuation (！＠＃…) → half-width (!@#…)
//   - Full-width space (U+3000) → half-width space
//   - Half-width katakana (ｶﾀｶﾅ, with combining dakuten/handakuten) → full-width
//     katakana (カタカナ, with the marks properly merged into ガ / パ etc.)
//
// Applies only to JP-content fields (the `normalizes: true` flag on operator
// descriptors). Site, inurl, filetype, dates, and number ranges pass through
// untouched — the caller chooses.
//
// One caveat to disclose in the help popover: NFKC also collapses some
// less-common compatibility forms (e.g. circled numbers ① → 1, ㍉ → ミリ).
// This is occasionally surprising but is the standard normalization Japanese
// search engines apply internally, so the broadened results are usually what
// the user wants. The toggle is opt-in (off by default), which mitigates the
// surprise.

/**
 * @param {() => boolean} getEnabled - returns true when the normalize toggle is checked
 * @returns {(text: string) => string}
 */
export function createNormalizer(getEnabled) {
  return function normalize(text) {
    if (!getEnabled() || !text) return text;
    return String(text).normalize('NFKC');
  };
}
