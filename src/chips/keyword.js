import { renderWarningGlyph } from '../ui/chip-popover.js';
import { getActiveEngine } from '../core/engine.js';
import { t } from '../i18n/messages.js';

// Keyword chip — the primary chip type. Carries free-text content plus an
// optional content operator. The catalogue of operators lives on the active
// engine descriptor (see src/core/engine.js + src/engines/<id>.js); this
// module reads it lazily so a single chip type covers Google operators
// (site, intitle, intext, inanchor, inurl) AND X / Twitter operators (from,
// to, mention, hashtag, url, list, lang, near, source, ...).
//
// Per-chip toggles:
//   - negate (NOT prefix, leading `-`)
//   - quoted (exact-phrase wrapping; only when the operator is `quotable`)
//   - operator (cycles via inline dropdown; values come from the engine)
//
// Wildcard (*) is just typed inside a regular keyword chip — no dedicated
// chip type needed because both engines parse `*` literally inside text.

export const type = 'keyword';
export const label = 'engine.google.op.none.label';

const FALLBACK_OP = {
  label: 'engine.google.op.none.label',
  opName: '',
  dir: 'auto',
  normalizes: true,
  quotable: true,
  acceptsArabic: true,
};

/** Engine-driven operator catalogue. */
function getOperators() {
  const eng = getActiveEngine();
  return eng.keywordOperators || { none: FALLBACK_OP };
}

function getOperatorKeys() {
  const eng = getActiveEngine();
  return eng.keywordOperatorOrder || Object.keys(getOperators());
}

function getOp(key) {
  const ops = getOperators();
  return ops[key] || ops.none || FALLBACK_OP;
}

/**
 * Render an operator's value into its query-string fragment. Honors the
 * descriptor's optional `format` hook (e.g. `@user` instead of `mention:user`),
 * falling back to the conventional `op:value` form.
 */
function formatValue(op, value) {
  if (typeof op.format === 'function') return op.format(value);
  return op.opName ? op.opName + ':' + value : value;
}

// Public accessors for other modules (composer pills, paste parser).
// These resolve against the active engine on every read so an engine
// switch immediately affects callers without manual re-binding.
export function getOperatorsForActive() { return getOperators(); }
export function getOperatorKeysForActive() { return getOperatorKeys(); }

export function defaultProps() {
  return { text: '', operator: 'none', negate: false, quoted: false };
}

/**
 * Per-chip validation issues — surfaced as a glyph + popover on the chip.
 *
 * @param {{ props: { text: string, operator: string, negate: boolean, quoted: boolean } }} chip
 * @returns {Array<{ severity: 'warning' | 'tip', message: string, fix?: { label: string, apply: () => object } }>}
 */
export function validate(chip) {
  const issues = [];
  const text = (chip.props.text || '').trim();
  const ops = getOperators();
  const opKey = ops[chip.props.operator] ? chip.props.operator : 'none';
  const op = getOp(opKey);
  const eng = getActiveEngine();
  const multiWordOps = eng.multiWordOps || new Set();
  const nonLatinForbiddenOps = eng.nonLatinForbiddenOps || new Set();

  // Multi-word value on a single-token operator without quoting silently
  // binds only the first word to the operator (Google: intitle/intext/inanchor;
  // X has none — handles/IDs are single-token).
  if (multiWordOps.has(opKey) && text && /\s/.test(text) && !chip.props.quoted) {
    issues.push({
      severity: 'warning',
      message: t('chip.keyword.validate.multiWord'),
      fix: { label: t('chip.keyword.validate.multiWordFix'), apply: () => ({ quoted: true }) },
    });
  }

  // Latin-only operator with non-ASCII chars (Japanese kana/kanji, etc.).
  if (nonLatinForbiddenOps.has(opKey) && /[^\x00-\x7F]/.test(text)) {
    issues.push({
      severity: 'warning',
      message: t('chip.keyword.validate.nonLatinForbidden'),
    });
  }

  // Quoting a single word disables spell correction and synonyms.
  if (chip.props.quoted && op.quotable && text && !/\s/.test(text)) {
    issues.push({
      severity: 'tip',
      message: t('chip.keyword.validate.singleWordQuoted'),
      fix: { label: t('chip.keyword.validate.singleWordQuotedFix'), apply: () => ({ quoted: false }) },
    });
  }

  return issues;
}

/**
 * @param {{ id: string, type: string, props: { text: string, operator: string, negate: boolean, quoted: boolean } }} chip
 * @param {import('../core/ctx.js').Ctx} ctx
 */
export function assemble(chip, ctx) {
  const text = (chip.props.text || '').trim();
  if (!text) return '';
  const ops = getOperators();
  const opKey = ops[chip.props.operator] ? chip.props.operator : 'none';
  const op = getOp(opKey);
  const value = op.normalizes ? ctx.normalize(text) : text;
  const wrapped = (chip.props.quoted && op.quotable) ? '"' + value + '"' : value;
  let s = formatValue(op, wrapped);
  if (chip.props.negate) s = '-' + s;
  return s;
}

/**
 * @param {{ id: string, type: string, props: object }} chip
 * @param {{ onDelete: () => void, onToggleNegate: () => void, onToggleQuoted: () => void, onChangeOperator?: (op: string) => void, onChangeText?: (text: string) => void, onAddOrBranch?: () => void }} handlers
 */
export function render(chip, handlers) {
  const op = getOp(chip.props.operator);
  const operatorKeys = getOperatorKeys();
  const operators = getOperators();

  const el = document.createElement('span');
  el.className = 'chip chip-keyword';
  if (chip.props.negate) el.classList.add('chip-negate');
  if (chip.props.quoted && op.quotable) el.classList.add('chip-quoted');
  if (op.opName) el.classList.add('chip-has-op');
  el.dataset.chipId = chip.id;

  // Delete button (×).
  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'chip-delete-btn';
  del.setAttribute('aria-label', t('chip.keyword.deleteAria'));
  del.textContent = '×';
  del.addEventListener('click', (e) => {
    e.stopPropagation();
    handlers.onDelete();
  });

  // "+أو" branch handle — leading-edge button that extends this chip into
  // an OR group (or appends a new alternative to an existing group). The
  // chip-area handler walks the chip array forward to find the end of the
  // contiguous OR run before splicing in the connector + new keyword.
  let orHandle = null;
  if (handlers.onAddOrBranch) {
    orHandle = document.createElement('button');
    orHandle.type = 'button';
    orHandle.className = 'chip-or-handle';
    orHandle.setAttribute('aria-label', t('chip.keyword.orHandleAria'));
    orHandle.title = t('chip.keyword.orHandleAria');
    orHandle.textContent = t('chip.keyword.orHandleText');
    orHandle.addEventListener('click', (e) => {
      e.stopPropagation();
      handlers.onAddOrBranch();
    });
  }

  // "− ليس" toggle — edge button that flips this chip's negate flag.
  // Visual sibling of the OR handle so the two boolean modifiers read at
  // the same weight, instead of OR being prominent and NOT hiding inside
  // the small tools cluster.
  const notHandle = document.createElement('button');
  notHandle.type = 'button';
  notHandle.className = 'chip-not-handle';
  notHandle.setAttribute('aria-pressed', chip.props.negate ? 'true' : 'false');
  notHandle.setAttribute('aria-label', chip.props.negate ? t('chip.keyword.notOn') : t('chip.keyword.notOff'));
  notHandle.title = chip.props.negate ? t('chip.keyword.notOn') : t('chip.keyword.notOff');
  notHandle.textContent = t('chip.keyword.notHandleText');
  notHandle.addEventListener('click', (e) => {
    e.stopPropagation();
    handlers.onToggleNegate();
  });

  // Operator badge (LTR mono prefix). Only rendered when an operator is set.
  // Honors `op.badge` (e.g. '@', '#', '$' for prefix operators) when present;
  // otherwise falls back to `op.opName + ':'`.
  let opBadge = null;
  if (op.opName) {
    opBadge = document.createElement('span');
    opBadge.className = 'chip-op-badge';
    opBadge.dir = 'ltr';
    opBadge.textContent = op.badge != null ? op.badge : (op.opName + ':');
  }

  // Editable text. Click chip body to edit inline. We use a contenteditable
  // span to keep RTL/LTR isolation per chip.
  const textEl = document.createElement('span');
  textEl.className = 'chip-text';
  textEl.dir = op.dir;
  textEl.setAttribute('contenteditable', 'plaintext-only');
  textEl.spellcheck = false;
  textEl.textContent = chip.props.quoted && op.quotable
    ? '"' + (chip.props.text || '') + '"'
    : (chip.props.text || '');
  // Strip surrounding quotes when committing — they're a visual hint, not part
  // of `text` storage.
  function commitText() {
    let v = textEl.textContent || '';
    if (chip.props.quoted && op.quotable) {
      v = v.replace(/^"+/, '').replace(/"+$/, '');
    }
    if (handlers.onChangeText) handlers.onChangeText(v);
  }
  textEl.addEventListener('blur', commitText);
  textEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      textEl.blur();
    }
  });

  // Negate prefix glyph. Visual-only; the prop drives query output.
  let negPrefix = null;
  if (chip.props.negate) {
    negPrefix = document.createElement('span');
    negPrefix.className = 'chip-neg-prefix';
    negPrefix.setAttribute('aria-hidden', 'true');
    negPrefix.textContent = '−';
  }

  // Tools row: operator dropdown, quote toggle, NOT toggle.
  const tools = document.createElement('span');
  tools.className = 'chip-tools';

  // Operator dropdown.
  if (handlers.onChangeOperator) {
    const select = document.createElement('select');
    select.className = 'chip-op-select';
    select.setAttribute('aria-label', t('chip.keyword.opSelectAria'));
    operatorKeys.forEach(key => {
      const o = operators[key];
      if (!o) return;
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = t(o.label);
      if (key === chip.props.operator) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener('change', (e) => {
      handlers.onChangeOperator(e.target.value);
    });
    select.addEventListener('click', (e) => e.stopPropagation());
    tools.appendChild(select);
  }

  // Quote toggle (only when the operator allows quoting).
  if (op.quotable) {
    const quoteBtn = document.createElement('button');
    quoteBtn.type = 'button';
    quoteBtn.className = 'chip-tool-btn';
    quoteBtn.setAttribute('aria-pressed', chip.props.quoted ? 'true' : 'false');
    quoteBtn.setAttribute('aria-label', chip.props.quoted ? t('chip.keyword.quoteOn') : t('chip.keyword.quoteOff'));
    quoteBtn.textContent = '"';
    quoteBtn.title = chip.props.quoted ? t('chip.keyword.quoteOn') : t('chip.keyword.quoteOff');
    quoteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handlers.onToggleQuoted();
    });
    tools.appendChild(quoteBtn);
  }

  // Per-chip warning/tip glyph (opens a popover with the issues + fix buttons).
  const glyph = renderWarningGlyph(chip, validate(chip), handlers);

  el.appendChild(del);
  if (opBadge) el.appendChild(opBadge);
  if (glyph) el.appendChild(glyph);
  if (negPrefix) el.appendChild(negPrefix);
  el.appendChild(textEl);
  el.appendChild(tools);
  el.appendChild(notHandle);
  if (orHandle) el.appendChild(orHandle);
  return el;
}
