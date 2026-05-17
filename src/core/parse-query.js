// Paste parser — converts a Google-style query string into chip descriptors.
//
// Used by the composer's paste handler so users who already know the syntax
// (or who are pasting an existing query they composed elsewhere) can drop a
// query in and get chips out, instead of being forced to recreate it field
// by field.
//
// Strategy:
//   1. Heuristic gate — if the input looks like a plain word or two with no
//      operators / quotes / OR / NOT, return null. The composer then lets
//      the default paste behavior fall through into the input.
//   2. Tokenize the string respecting:
//        - quoted strings (no splitting inside "...")
//        - the literal `OR` keyword (uppercase only)
//        - parentheses around OR groups
//   3. Walk the tokens and emit chip descriptors:
//        - operator:value tokens become keyword chips with the right operator
//          (or filetype / before / after chips for those special operators)
//        - bare words become plain keyword chips
//        - "..." quoted strings become quoted keyword chips
//        - leading "-" produces negate=true
//        - "a OR b" sequences insert an or-connector chip between the terms
//        - LOW..HIGH (with optional prefix) becomes a number-range chip
//        - "a" AROUND(N) "b" becomes a proximity chip
//   4. Group adjacent before:/after: tokens into a single date-range chip.
//
// Best-effort: malformed input falls through. We never throw; we skip what we
// can't parse and keep going. Returning [] for empty input lets the composer
// distinguish "user pasted nothing meaningful" from "user pasted plain text".

import { getActiveEngine } from './engine.js';

// Default operator set used as a safety net before the engine controller
// has been constructed. Real values come from `engine.parser`.
const DEFAULT_KEYWORD_OPERATORS = new Set(['site', 'intitle', 'intext', 'inanchor', 'inurl']);

function getParserSpec() {
  const eng = getActiveEngine();
  return eng.parser || { keywordOperators: DEFAULT_KEYWORD_OPERATORS, prefixOperators: {} };
}

function getDateOps() {
  const eng = getActiveEngine();
  return eng.dateRangeOps || { after: 'after', before: 'before' };
}

/**
 * Parse an engine-flavored query string into an ordered list of chip-shaped
 * descriptors. The recognized operator set, prefix tokens (`@`, `#`, `$`),
 * and date-range op names all come from the active engine — Google
 * recognizes site/intitle/etc. and before/after; X recognizes from/to/lang
 * + prefix tokens and since/until.
 *
 * Returns null if the input looks like plain text (no recognizable
 * operators); returns [] if input is empty/whitespace only.
 *
 * @param {string} input
 * @returns {null | Array<{ type: string, props: object }>}
 */
export function parseQuery(input) {
  if (input == null) return [];
  const text = String(input);
  if (!text.trim()) return [];

  // Heuristic gate: only run the full parser if the string carries some
  // structural marker. Plain words like "cairo" or "محمد علي" should fall
  // through to the regular paste behavior. We look for: a colon (operator),
  // a quote, the OR keyword (with surrounding space), an open paren, a
  // numeric range marker, or a leading / mid-string negate prefix.
  // On X we also accept a leading `@`, `#`, or `$` prefix as structure.
  if (!hasStructure(text)) return null;

  const tokens = tokenize(text);
  if (tokens.length === 0) return [];

  const chips = walk(tokens);
  // If walking produced nothing usable, treat as plain text rather than
  // silently swallowing the paste.
  if (chips.length === 0) return null;
  return chips;
}

/**
 * True when the string contains any recognizable structural marker.
 * Plain word(s) without these markers should NOT trigger the parser.
 */
function hasStructure(text) {
  if (text.includes('"')) return true;
  if (text.includes(':')) return true;
  if (text.includes('(')) return true;
  if (text.includes('..')) return true;
  if (/(^|\s)OR(\s|$)/.test(text)) return true;
  // Leading minus, or a mid-string " -" (negate prefix on a later token).
  if (text.trimStart().startsWith('-')) return true;
  if (/\s-\S/.test(text)) return true;
  // Engine-specific prefix operators (X: @, #, $). Case-sensitive by design —
  // Twitter prefix ops are literal characters, not Latin keywords, so no
  // case-insensitive flag is needed.
  const prefixChars = Object.keys(getParserSpec().prefixOperators || {});
  if (prefixChars.length > 0) {
    const prefixRe = new RegExp('(^|\\s)[' + prefixChars.map(c => '\\' + c).join('') + ']\\S');
    if (prefixRe.test(text)) return true;
  }
  return false;
}

// ===== Tokenizer =====
//
// Produces an array of token objects:
//   { kind: 'word', value: string, negate: boolean }   plain word or operator:value
//   { kind: 'phrase', value: string, negate: boolean } quoted phrase, no quotes in value
//   { kind: 'or' }                                     literal OR keyword
//   { kind: 'lparen' }                                 (
//   { kind: 'rparen' }                                 )
//
// We strip the leading `-` from negate-prefixed tokens at tokenize time so
// downstream walkers don't have to re-handle it.

function tokenize(text) {
  const tokens = [];
  let i = 0;
  const n = text.length;

  while (i < n) {
    const ch = text[i];

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i++;
      continue;
    }

    if (ch === '(') {
      tokens.push({ kind: 'lparen' });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ kind: 'rparen' });
      i++;
      continue;
    }

    // Special-case `AROUND(N)` so the proximity walker sees one token. We
    // detect it case-sensitively here because Google requires uppercase.
    const aroundMatch = /^AROUND\((\d+)\)/.exec(text.slice(i));
    if (aroundMatch) {
      tokens.push({ kind: 'word', value: aroundMatch[0], negate: false });
      i += aroundMatch[0].length;
      continue;
    }

    // Negate prefix for an upcoming word or phrase.
    let negate = false;
    if (ch === '-' && i + 1 < n && text[i + 1] !== ' ' && text[i + 1] !== '\t') {
      negate = true;
      i++;
    }

    // Operator:value where value might be quoted, e.g. intitle:"foo bar".
    // We handle this generically as a word read until the next whitespace,
    // BUT we honor a quoted run starting after the colon so that
    // `intitle:"foo bar"` becomes one token.
    if (text[i] === '"') {
      const phrase = readQuoted(text, i);
      i = phrase.end;
      tokens.push({ kind: 'phrase', value: phrase.value, negate, prefix: '' });
      continue;
    }

    // Read a bare word. If we hit `:` and the next char is `"`, jump into
    // the quoted run and append it (with quotes stripped) so the token
    // value is `operator:value with spaces`.
    let start = i;
    let buf = '';
    while (i < n) {
      const c = text[i];
      if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '(' || c === ')') break;
      if (c === '"') {
        // Enter a quoted segment as part of this same word.
        const phrase = readQuoted(text, i);
        buf += phrase.raw; // preserve quotes inside the word so we can detect it later
        i = phrase.end;
        continue;
      }
      buf += c;
      i++;
    }

    if (!buf) continue;

    // Detect literal `OR` keyword (case-sensitive). Lowercase `or` is just
    // a word.
    if (buf === 'OR' && !negate) {
      tokens.push({ kind: 'or' });
      continue;
    }

    tokens.push({ kind: 'word', value: buf, negate });
  }

  return tokens;
}

/**
 * Read a quoted run starting at text[i] (which must be `"`). Returns the
 * inner value (without quotes), the raw source (with quotes), and the
 * index past the closing quote. If no closing quote exists, reads to end.
 */
function readQuoted(text, i) {
  const start = i;
  i++; // skip opening "
  let buf = '';
  while (i < text.length && text[i] !== '"') {
    buf += text[i];
    i++;
  }
  const closed = text[i] === '"';
  if (closed) i++;
  return {
    value: buf,
    raw: text.slice(start, i),
    end: i,
  };
}

// ===== Walker =====
//
// Walks tokens left-to-right and emits chip descriptors. Handles:
//   - operator:value tokens (including filetype, before, after, and the
//     keyword-style operators)
//   - bare word / phrase → keyword chip
//   - LOW..HIGH (with optional prefix) → number-range chip
//   - "a" AROUND(N) "b" → proximity chip
//   - OR sequences → or-connector chips between adjacent term chips
//   - parentheses are stripped (visual hint only)
//
// A second pass merges adjacent before:/after: chips into one date-range.

function walk(tokens) {
  const out = [];
  let i = 0;

  const parser = getParserSpec();
  const keywordOps = parser.keywordOperators || DEFAULT_KEYWORD_OPERATORS;
  const prefixOps = parser.prefixOperators || {};
  const dateOps = getDateOps();
  const dateAfterOp = dateOps.after;     // 'after' | 'since'
  const dateBeforeOp = dateOps.before;   // 'before' | 'until'

  while (i < tokens.length) {
    const t = tokens[i];

    if (t.kind === 'lparen' || t.kind === 'rparen') {
      i++;
      continue;
    }

    if (t.kind === 'or') {
      // OR between two term chips → emit an or-connector. Drop leading or
      // duplicate ORs to keep the chip array well-formed.
      const prev = out[out.length - 1];
      if (prev && prev.type !== 'or-connector') {
        out.push({ type: 'or-connector', props: {} });
      }
      i++;
      continue;
    }

    // Try a proximity match: word/phrase, then `AROUND(N)`, then word/phrase.
    const prox = tryProximity(tokens, i);
    if (prox) {
      out.push(prox.chip);
      i = prox.next;
      continue;
    }

    if (t.kind === 'phrase') {
      out.push({
        type: 'keyword',
        props: { text: t.value, operator: 'none', quoted: true, negate: !!t.negate },
      });
      i++;
      continue;
    }

    // t.kind === 'word' from here on.
    const word = t.value;
    const negate = !!t.negate;

    // Engine-specific prefix operators: `@user`, `#tag`, `$AAPL`.
    if (word.length > 1) {
      const first = word[0];
      const opForPrefix = prefixOps[first];
      if (opForPrefix) {
        out.push({
          type: 'keyword',
          props: { text: word.slice(1), operator: opForPrefix, quoted: false, negate },
        });
        i++;
        continue;
      }
    }

    // Twitter min_*: as a one-off shape — `min_faves:1000`, `-min_retweets:500`.
    const engagementMatch = /^(min_(?:faves|replies|retweets)):(\d+)$/.exec(word);
    if (engagementMatch) {
      out.push({
        type: 'engagement',
        props: {
          metric: engagementMatch[1],
          direction: negate ? 'max' : 'min',
          value: parseInt(engagementMatch[2], 10),
        },
      });
      i++;
      continue;
    }

    // Twitter filter:* / include:nativeretweets.
    const filterMatch = /^(filter|include):([a-z_]+)$/i.exec(word);
    if (filterMatch) {
      const head = filterMatch[1].toLowerCase();
      const value = filterMatch[2].toLowerCase();
      // include:nativeretweets is the "additionally include" form — model it
      // as a filter chip with negate=true so toggling restores filter:.
      const negateFlag = head === 'include' ? true : negate;
      out.push({ type: 'filter', props: { value, negate: negateFlag } });
      i++;
      continue;
    }

    // Operator:value form?
    const colonIdx = word.indexOf(':');
    if (colonIdx > 0 && colonIdx < word.length - 1) {
      const op = word.slice(0, colonIdx).toLowerCase();
      let value = word.slice(colonIdx + 1);
      // If the value is wrapped in quotes (came in via the tokenizer's
      // inline-quote handling), strip them and mark quoted.
      let quoted = false;
      if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
        quoted = true;
      }

      if (op === 'filetype') {
        out.push({ type: 'filetype', props: { value: value.toLowerCase() } });
        i++;
        continue;
      }
      if (op === dateAfterOp) {
        out.push({ type: 'date-range', props: { after: value, before: '' } });
        i++;
        continue;
      }
      if (op === dateBeforeOp) {
        out.push({ type: 'date-range', props: { before: value, after: '' } });
        i++;
        continue;
      }
      if (keywordOps.has(op)) {
        out.push({
          type: 'keyword',
          props: { text: value, operator: op, quoted, negate },
        });
        i++;
        continue;
      }
      // Unknown operator: fall through and treat the whole token as a word.
    }

    // Number-range form: LOW..HIGH with optional prefix on both sides.
    const numRange = tryNumberRange(word);
    if (numRange) {
      out.push({ type: 'number-range', props: numRange });
      i++;
      continue;
    }

    // Plain word.
    out.push({
      type: 'keyword',
      props: { text: word, operator: 'none', quoted: false, negate },
    });
    i++;
  }

  // Coalesce adjacent date-range chips (so two date tokens become one
  // chip with both fields set).
  return mergeDateRanges(out);
}

/**
 * Match `"a" AROUND(N) "b"` (or unquoted variants). Returns
 * { chip, next } if matched, otherwise null. Accepts word or phrase tokens
 * for the two terms. The middle token must be `AROUND(N)` as a single bare
 * word — that's how Google emits it and how our own assembler emits it.
 */
function tryProximity(tokens, i) {
  const a = tokens[i];
  const mid = tokens[i + 1];
  const b = tokens[i + 2];
  if (!a || !mid || !b) return null;
  if (a.kind !== 'word' && a.kind !== 'phrase') return null;
  if (b.kind !== 'word' && b.kind !== 'phrase') return null;
  if (mid.kind !== 'word') return null;
  const m = /^AROUND\((\d+)\)$/.exec(mid.value);
  if (!m) return null;
  let n = parseInt(m[1], 10);
  if (isNaN(n) || n < 1) n = 5;
  if (n > 50) n = 50;
  // Strip embedded quotes from word-tokens that came in quoted (e.g. when
  // the user pasted unquoted terms next to AROUND).
  const term1 = stripWrappingQuotes(a.kind === 'phrase' ? a.value : a.value);
  const term2 = stripWrappingQuotes(b.kind === 'phrase' ? b.value : b.value);
  return {
    chip: { type: 'proximity', props: { term1, distance: n, term2 } },
    next: i + 3,
  };
}

function stripWrappingQuotes(s) {
  if (typeof s !== 'string') return '';
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1);
  return s;
}

/**
 * Match a number-range token like `1950..1960` or `$50..$100`. Returns a
 * number-range props object if matched, otherwise null.
 */
function tryNumberRange(word) {
  // Optional non-digit prefix, digits, "..", optional same prefix, digits.
  // We accept either `PREFIXLOW..PREFIXHIGH` or `LOW..HIGH`.
  const m = /^(\D*)(\d+)\.\.(\D*)(\d+)$/.exec(word);
  if (!m) return null;
  const prefix1 = m[1];
  const low = m[2];
  const prefix2 = m[3];
  const high = m[4];
  // If both prefixes are present they should match; if only the first is
  // present, treat it as the unit prefix.
  let prefix = '';
  if (prefix1 && prefix2 && prefix1 === prefix2) prefix = prefix1;
  else if (prefix1 && !prefix2) prefix = prefix1;
  else if (!prefix1 && prefix2) prefix = prefix2;
  return { low, high, prefix };
}

/**
 * Merge consecutive date-range descriptors into a single one. The walker
 * emits one date-range chip per `before:` / `after:` token; this collapses
 * pairs into a single chip with both sides populated.
 */
function mergeDateRanges(chips) {
  const out = [];
  for (const chip of chips) {
    const last = out[out.length - 1];
    if (
      chip.type === 'date-range' &&
      last && last.type === 'date-range' &&
      // Only merge if the two halves don't conflict.
      ((!last.props.before && chip.props.before) || (!last.props.after && chip.props.after))
    ) {
      last.props = {
        before: last.props.before || chip.props.before || '',
        after: last.props.after || chip.props.after || '',
      };
      continue;
    }
    out.push(chip);
  }
  return out;
}
