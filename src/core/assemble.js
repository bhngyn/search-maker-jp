// Assemble the query string from registered segments.
//
// Each segment is { order: number, fn: () => string }. Segments are sorted
// by `order` (the canonical 1–15 from CLAUDE.md), each segment function is
// called fresh on every assembly pass, empty results are dropped, and the
// remaining strings are joined with single spaces.

/**
 * @param {Array<{ order: number, fn: () => string }>} segments
 * @returns {() => string}
 */
export function createAssembler(segments) {
  return function assembleQuery() {
    const ordered = segments.slice().sort((a, b) => a.order - b.order);
    const parts = [];
    for (const seg of ordered) {
      try {
        const out = seg.fn();
        if (out && String(out).trim()) parts.push(String(out).trim());
      } catch (e) {
        console.warn('segment failed', seg.order, e);
      }
    }
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  };
}
