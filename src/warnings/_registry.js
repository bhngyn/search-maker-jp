// Cross-cutting / aggregate warnings. Each module exports register(ctx, deps)
// where deps = { previewBox, chipState }. Modules return { onRender } if they
// recompute on every preview pass; the bootstrap pushes that callback into
// postRenderHooks.
//
// Chip-local issues (intitle multi-word without quotes, reversed date range,
// single-word quoting) are surfaced as per-chip warning glyphs with one-tap
// fixes — see chips/keyword.js and chips/date-range.js — and are intentionally
// NOT also reported as banner warnings here, to avoid duplicating the same
// signal in two places.

import * as queryTooLong from './query-too-long.js';
import * as overRestricted from './over-restricted.js';
import * as operatorNonLatinChars from './operator-non-latin-chars.js';

export const warnings = [
  queryTooLong,
  overRestricted,
  operatorNonLatinChars,
];
