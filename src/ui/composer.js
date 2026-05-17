// Chip composer — the input + commit button that turns typed text into
// keyword chips.
//
// Commit paths:
//   Enter / "أضف"          ⇒ append a keyword chip (implicit AND)
//   Shift+Enter            ⇒ append an OR-connector then a keyword chip,
//                            forming/extending an OR group (still in the
//                            keydown handler — the standalone OR button was
//                            removed in favor of per-chip OR affordances)
//   Leading "-" + space    ⇒ append a keyword chip with negate=true. The
//                            standalone NOT button was removed; this shortcut
//                            and the per-chip "−" tool remain the entry points.
//   Paste                  ⇒ if the pasted text looks like a Google query
//                            (has operators, quotes, OR, etc.), parse it
//                            into chips. Plain-text pastes fall through.

// Flow-state ergonomics (Phase 6):
//   - Ghost-chip preview that mirrors what would commit on Enter, sitting
//     below the input. Crucial for low-literacy users — makes the chip
//     metaphor concrete the first time they type.
//   - Backspace on an empty input removes the most recent chip (with no
//     undo, intentionally — fast typists expect this and the chip itself
//     remains in DOM until they Backspace again).
//   - Space alone never auto-commits (Arabic phrases contain spaces).
//   - Empty Enter is a no-op. Buttons disable when the input is empty.

import { parseQuery } from '../core/parse-query.js';
import { getOperatorsForActive } from '../chips/keyword.js';
import { getActiveEngine } from '../core/engine.js';
import { t } from '../i18n/messages.js';

// "Convert to" operator pills shown under the ghost preview while the
// user is typing. The pill list is engine-driven (see src/engines/<id>.js
// `composerPills`): Google offers site/intitle/intext/etc.; X offers
// from/to/mention/hashtag/etc. Picking one re-renders the ghost so the
// user sees the operator prefix before commit; Enter then commits with
// that operator pre-set on the new keyword chip. Selection is local to
// the composer — it never touches chip-state until commit, and it resets
// to 'none' after each commit so the next keyword starts as a plain term.

/**
 * @param {object} args
 * @param {HTMLElement} args.host
 * @param {{ add: Function, last: Function, remove: Function, removeMany: Function, getAll: Function }} args.chipState
 * @param {{ on: (cb: Function) => void }} [args.engine] - engine controller; rebuilds pills on switch
 * @param {{ on: (cb: Function) => void }} [args.lang] - lang controller; re-paints strings on switch
 */
export function wireComposer({ host, chipState, engine, lang }) {
  host.classList.add('composer');
  host.innerHTML = `
    <div class="composer-input-row">
      <input
        type="text"
        class="composer-input"
        id="composer-input"
        autocomplete="off"
        spellcheck="false"
        aria-describedby="composer-ghost-hint"
      />
    </div>
    <div class="composer-ghost-row" id="composer-ghost-row" aria-hidden="true">
      <div class="composer-ghost-line">
        <span class="composer-ghost-label" id="composer-ghost-label-text"></span>
        <span class="composer-ghost-chip" id="composer-ghost-chip"></span>
      </div>
      <div class="composer-op-row" role="group" id="composer-op-row">
        <div class="composer-op-pills" id="composer-op-pills" role="group"></div>
        <button
          type="button"
          class="composer-quote-toggle"
          id="composer-quote-toggle"
          aria-pressed="false"
        >
          <span class="composer-quote-toggle-glyph" dir="ltr">"&nbsp;"</span>
          <span class="composer-quote-toggle-label" id="composer-quote-toggle-label-text"></span>
        </button>
        <span class="composer-op-row-divider" aria-hidden="true"></span>
        <button
          type="button"
          class="composer-modifier-toggle composer-not-toggle"
          id="composer-not-toggle"
          aria-pressed="false"
        >
          <span class="composer-modifier-toggle-glyph" dir="ltr">−</span>
          <span class="composer-modifier-toggle-label" id="composer-not-toggle-label-text"></span>
        </button>
        <button
          type="button"
          class="composer-modifier-toggle composer-or-toggle"
          id="composer-or-toggle"
          aria-pressed="false"
        >
          <span class="composer-modifier-toggle-glyph" dir="ltr">⫦</span>
          <span class="composer-modifier-toggle-label" id="composer-or-toggle-label-text"></span>
        </button>
      </div>
      <p class="composer-quote-hint" id="composer-quote-hint-text"></p>
      <p class="composer-ghost-paste-hint" id="composer-ghost-paste-hint" aria-live="polite"></p>
    </div>
    <div class="composer-commit-row" role="group" id="composer-commit-row">
      <button type="button" class="composer-btn composer-btn-and" id="composer-btn-and" disabled>
      </button>
      <button type="button" class="composer-btn composer-btn-add" id="composer-btn-add">
      </button>
    </div>
    <p class="composer-hint" id="composer-ghost-hint"></p>
  `;

  const input = host.querySelector('#composer-input');
  const btnAnd = host.querySelector('#composer-btn-and');
  const btnAdd = host.querySelector('#composer-btn-add');
  const ghostRow = host.querySelector('#composer-ghost-row');
  const ghostChip = host.querySelector('#composer-ghost-chip');
  const ghostLabel = host.querySelector('#composer-ghost-label-text');
  const pillsRow = host.querySelector('#composer-op-pills');
  const quoteToggle = host.querySelector('#composer-quote-toggle');
  const quoteToggleLabel = host.querySelector('#composer-quote-toggle-label-text');
  const notToggle = host.querySelector('#composer-not-toggle');
  const notToggleLabel = host.querySelector('#composer-not-toggle-label-text');
  const orToggle = host.querySelector('#composer-or-toggle');
  const orToggleLabel = host.querySelector('#composer-or-toggle-label-text');
  const opRow = host.querySelector('#composer-op-row');
  const quoteHint = host.querySelector('#composer-quote-hint-text');
  const pasteHintEl = host.querySelector('#composer-ghost-paste-hint');
  const helpHint = host.querySelector('#composer-ghost-hint');
  const commitRow = host.querySelector('#composer-commit-row');

  function paintStaticStrings() {
    if (input) {
      input.placeholder = t('ui.composer.placeholder');
      input.setAttribute('aria-label', t('ui.composer.ariaLabel'));
      // JP fork is always LTR; the chip-area separately handles the dir of
      // each chip's value via the operator descriptor's `dir` field.
      input.dir = 'ltr';
    }
    if (ghostLabel) ghostLabel.textContent = t('ui.composer.ghostLabel');
    if (pillsRow) pillsRow.setAttribute('aria-label', t('ui.composer.opPillsLabel'));
    if (quoteToggle) {
      quoteToggle.setAttribute('aria-label', t('ui.composer.quoteToggleLabel'));
      quoteToggle.setAttribute('title', t('ui.composer.quoteToggleTitle'));
    }
    if (quoteToggleLabel) quoteToggleLabel.textContent = t('ui.composer.quoteToggleLabel');
    if (notToggle) {
      notToggle.setAttribute('aria-label', t('ui.composer.notToggleLabel'));
      notToggle.setAttribute('title', t('ui.composer.notToggleTitle'));
    }
    if (notToggleLabel) notToggleLabel.textContent = t('ui.composer.notToggleLabel');
    if (orToggle) {
      orToggle.setAttribute('aria-label', t('ui.composer.orToggleLabel'));
      orToggle.setAttribute('title', t('ui.composer.orToggleTitle'));
    }
    if (orToggleLabel) orToggleLabel.textContent = t('ui.composer.orToggleLabel');
    if (opRow) opRow.setAttribute('aria-label', t('ui.composer.opPillsLabel'));
    if (quoteHint) quoteHint.textContent = t('ui.composer.quoteHint');
    if (pasteHintEl) pasteHintEl.textContent = t('ui.composer.pasteHint');
    if (commitRow) commitRow.setAttribute('aria-label', t('ui.composer.commitGroupLabel'));
    if (btnAnd) btnAnd.textContent = t('ui.composer.btnAnd');
    if (btnAdd) {
      btnAdd.textContent = t('ui.composer.btnAddSpecial');
      btnAdd.setAttribute('aria-label', t('ui.composer.btnAddSpecialAria'));
    }
    if (helpHint) helpHint.textContent = t('ui.composer.helpText');
  }
  paintStaticStrings();

  // Pre-commit operator selection. Lives only here — chip-state never sees
  // it until commit() builds the keyword chip's props.
  let chosenOp = 'none';
  // Pre-commit literal-quote selection. Orthogonal to chosenOp. Resets
  // after each commit so quoting stays explicit per chip.
  let chosenQuoted = false;
  // Pre-commit NOT (negate) and OR (alternative-of-previous) modifiers.
  // Both reset after commit. Mirror the leading-`-` and Shift+Enter
  // shortcuts as discoverable buttons.
  let chosenNegate = false;
  let chosenOr = false;

  function buildPills() {
    pillsRow.innerHTML = '';
    const eng = getActiveEngine();
    const pills = eng.composerPills || [{ op: 'none', label: 'engine.google.pill.none' }];
    const ops = getOperatorsForActive();
    // If the chosen op isn't in this engine's catalogue (e.g. user switched
    // engines mid-typing), reset to 'none' so commit doesn't blow up.
    if (!ops[chosenOp]) chosenOp = 'none';
    pills.forEach((descriptor) => {
      const { kind = 'op', label } = descriptor;
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'composer-op-pill';

      if (kind === 'instant') {
        // One-click shortcut that adds a special chip directly. No toggle
        // state — clicking always adds, regardless of typed input.
        const badgeText = descriptor.badge || '';
        pill.classList.add('composer-op-pill-instant');
        pill.innerHTML = `
          <span class="composer-op-pill-label">${t(label)}</span>
          <span class="composer-op-pill-badge" dir="ltr">${badgeText}</span>
        `;
        pill.addEventListener('click', (e) => {
          e.preventDefault();
          chipState.add(descriptor.type, descriptor.props || {});
          input.focus();
        });
      } else {
        const op = descriptor.op;
        pill.dataset.op = op;
        pill.setAttribute('aria-pressed', op === chosenOp ? 'true' : 'false');
        const opEntry = ops[op] || { opName: '' };
        const badgeText = opEntry.badge != null
          ? opEntry.badge
          : (opEntry.opName ? opEntry.opName + ':' : '—');
        pill.innerHTML = `
          <span class="composer-op-pill-label">${t(label)}</span>
          <span class="composer-op-pill-badge" dir="ltr">${badgeText}</span>
        `;
        pill.addEventListener('click', (e) => {
          e.preventDefault();
          chosenOp = op;
          syncPillsPressed();
          ghostPreview();
          input.focus();
        });
      }
      pillsRow.appendChild(pill);
    });
  }

  function syncPillsPressed() {
    pillsRow.querySelectorAll('.composer-op-pill:not(.composer-op-pill-instant)').forEach(p => {
      p.setAttribute('aria-pressed', p.dataset.op === chosenOp ? 'true' : 'false');
    });
    syncQuoteToggleEnabled();
  }

  // The quote toggle is meaningful only when the chosen operator is
  // quotable (site:, inurl: are not). When the user picks a non-quotable
  // operator we disable the toggle; the on-state survives the disable
  // (so flipping back to a quotable op restores the previous intent).
  function syncQuoteToggleEnabled() {
    if (!quoteToggle) return;
    const ops = getOperatorsForActive();
    const op = ops[chosenOp] || ops.none || { quotable: true };
    quoteToggle.disabled = !op.quotable;
  }
  function syncQuoteTogglePressed() {
    if (!quoteToggle) return;
    quoteToggle.setAttribute('aria-pressed', chosenQuoted ? 'true' : 'false');
  }

  function syncNotTogglePressed() {
    if (!notToggle) return;
    notToggle.setAttribute('aria-pressed', chosenNegate ? 'true' : 'false');
  }

  function syncOrTogglePressed() {
    if (!orToggle) return;
    orToggle.setAttribute('aria-pressed', chosenOr ? 'true' : 'false');
  }

  /**
   * Detect the leading-and-trailing `"` shortcut. Mirrors the leading-`-`
   * shortcut for negate. Returns { stripped, quoted } where `stripped` is
   * the inner text (or the original input if no shortcut was detected).
   */
  function applyQuoteShortcut(raw) {
    if (raw.length >= 2 && raw.startsWith('"') && raw.endsWith('"')) {
      return { stripped: raw.slice(1, -1).trim(), quoted: true };
    }
    return { stripped: raw, quoted: false };
  }

  function commit(mode) {
    let raw = input.value.trim();
    if (!raw) return;

    let negate = chosenNegate;
    if (raw.startsWith('-') && raw.length > 1) {
      negate = true;
      raw = raw.slice(1).trim();
    }
    if (mode === 'not') negate = true;

    // Leading-and-trailing `"` shortcut → strip and treat as quoted. Only
    // emits a quoted chip when the chosen operator allows quoting; for
    // non-quotable ops (site:, inurl:) the quotes are still stripped so
    // the chip text isn't littered with them, but `quoted` stays false.
    const { stripped, quoted: shortcutQuoted } = applyQuoteShortcut(raw);
    raw = stripped;
    if (!raw) return;

    const wantsOr = mode === 'or' || chosenOr;
    if (wantsOr) {
      const prev = chipState.last();
      if (prev && prev.type !== 'or-connector') {
        chipState.add('or-connector', {});
      }
    }

    const opsMap = getOperatorsForActive();
    const op = opsMap[chosenOp] || opsMap.none || { quotable: true };
    const quoted = (chosenQuoted || shortcutQuoted) && op.quotable;

    chipState.add('keyword', { text: raw, operator: chosenOp, negate, quoted });

    input.value = '';
    chosenOp = 'none';
    chosenQuoted = false;
    chosenNegate = false;
    chosenOr = false;
    syncPillsPressed();
    syncQuoteTogglePressed();
    syncNotTogglePressed();
    syncOrTogglePressed();
    refresh();
    input.focus();
  }

  function ghostPreview() {
    let raw = input.value.trim();
    if (!raw) {
      ghostRow.classList.remove('visible');
      ghostChip.textContent = '';
      return;
    }
    let negate = chosenNegate;
    if (raw.startsWith('-') && raw.length > 1) {
      negate = true;
      raw = raw.slice(1).trim();
    }
    // Apply the leading-and-trailing `"` shortcut to the preview so the
    // ghost chip already reads as quoted before the user presses Enter.
    const { stripped, quoted: shortcutQuoted } = applyQuoteShortcut(raw);
    raw = stripped;
    if (!raw) {
      ghostRow.classList.remove('visible');
      ghostChip.textContent = '';
      return;
    }
    // Render a faded preview chip mirroring keyword chip shape, including
    // the operator prefix when one is chosen so the user sees exactly what
    // will commit.
    const ops = getOperatorsForActive();
    const op = ops[chosenOp] || ops.none || { opName: '', dir: 'auto', quotable: true };
    const willQuote = (chosenQuoted || shortcutQuoted) && op.quotable;
    ghostChip.className = 'composer-ghost-chip'
      + (negate ? ' composer-ghost-chip-negate' : '')
      + (willQuote ? ' composer-ghost-chip-quoted' : '');
    ghostChip.innerHTML = '';
    if (chosenOr) {
      const orMark = document.createElement('span');
      orMark.className = 'composer-ghost-or';
      orMark.dir = 'ltr';
      orMark.textContent = '⫦ ';
      ghostChip.appendChild(orMark);
    }
    if (negate) {
      const neg = document.createElement('span');
      neg.className = 'composer-ghost-neg';
      neg.textContent = '− ';
      ghostChip.appendChild(neg);
    }
    if (op.opName) {
      const badge = document.createElement('span');
      badge.className = 'composer-ghost-op-badge';
      badge.dir = 'ltr';
      badge.textContent = op.badge != null ? op.badge : (op.opName + ':');
      ghostChip.appendChild(badge);
      ghostChip.appendChild(document.createTextNode(' '));
    }
    const term = document.createElement('span');
    term.dir = op.dir || 'auto';
    term.textContent = willQuote ? '"' + raw + '"' : raw;
    ghostChip.appendChild(term);
    ghostRow.classList.add('visible');
  }

  function refresh() {
    const has = input.value.trim().length > 0;
    btnAnd.disabled = !has;
    ghostPreview();
  }

  // Shared toast element (the same #toast used by the copy-confirmation in
  // core/preview.js). We construct DOM directly because the toast carries
  // an interactive button — preview.showToast only handles plain text.
  const toastEl = document.getElementById('toast');
  let toastTimer = null;

  function clearToast() {
    if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
    if (!toastEl) return;
    toastEl.classList.remove('visible');
    toastEl.classList.remove('toast-with-action');
    toastEl.innerHTML = '';
  }

  function showPasteUndoToast(addedIds) {
    if (!toastEl) return;
    clearToast();
    toastEl.classList.add('toast-with-action');
    const msg = document.createElement('span');
    msg.textContent = t('ui.composer.pasteToast', { count: addedIds.length });
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast-undo-btn';
    btn.textContent = t('ui.composer.pasteUndo');
    btn.addEventListener('click', () => {
      chipState.removeMany(addedIds);
      clearToast();
    });
    toastEl.appendChild(msg);
    toastEl.appendChild(btn);
    toastEl.classList.add('visible');
    toastTimer = setTimeout(clearToast, 1500);
  }

  // Plain-paste hint sits inside the ghost-row and auto-fades
  // after 4 seconds via class transitions.
  let pasteHintTimer = null;
  let pasteHintFadeTimer = null;
  function showPasteHint() {
    clearTimeout(pasteHintTimer);
    clearTimeout(pasteHintFadeTimer);
    ghostRow.classList.add('composer-ghost-row-paste-hint');
    ghostRow.classList.remove('composer-ghost-row-paste-hint-fading');
    // The ghost-row collapses to height:0 when input is empty; nudge it
    // visible so the hint is actually shown until the input is filled by
    // the default paste handler.
    ghostRow.classList.add('visible');
    pasteHintTimer = setTimeout(() => {
      ghostRow.classList.add('composer-ghost-row-paste-hint-fading');
      pasteHintFadeTimer = setTimeout(() => {
        ghostRow.classList.remove('composer-ghost-row-paste-hint');
        ghostRow.classList.remove('composer-ghost-row-paste-hint-fading');
      }, 350);
    }, 4000);
  }

  input.addEventListener('input', refresh);
  input.addEventListener('paste', (e) => {
    // Try to parse the pasted text as a Google-style query. If it parses
    // into one or more chip descriptors, insert them and clear the input.
    // If parseQuery returns null (the paste looks like plain text), fall
    // through to the browser's default paste, but show a one-shot hint so
    // the user knows their paste became a single chip on purpose.
    const cd = e.clipboardData || window.clipboardData;
    if (!cd) return;
    const pasted = cd.getData('text');
    if (!pasted) return;
    const descriptors = parseQuery(pasted);
    if (descriptors == null) {
      showPasteHint();
      return;
    }
    e.preventDefault();
    if (descriptors.length === 0) return; // empty / whitespace → no-op
    const addedIds = [];
    for (const d of descriptors) {
      const id = chipState.add(d.type, d.props);
      if (id) addedIds.push(id);
    }
    input.value = '';
    refresh();
    if (addedIds.length > 0) showPasteUndoToast(addedIds);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit(e.shiftKey ? 'or' : 'and');
      return;
    }
    if (e.key === 'Backspace' && input.value === '') {
      // Remove the last chip. No undo — the user can re-type. Skip if there
      // are no chips so this doesn't feel weirdly silent.
      const chips = chipState.getAll();
      if (chips.length > 0) {
        e.preventDefault();
        chipState.remove(chips[chips.length - 1].id);
      }
    }
  });

  btnAnd.addEventListener('click', () => commit('and'));

  if (quoteToggle) {
    quoteToggle.addEventListener('click', (e) => {
      e.preventDefault();
      if (quoteToggle.disabled) return;
      chosenQuoted = !chosenQuoted;
      syncQuoteTogglePressed();
      ghostPreview();
      input.focus();
    });
  }

  if (notToggle) {
    notToggle.addEventListener('click', (e) => {
      e.preventDefault();
      chosenNegate = !chosenNegate;
      syncNotTogglePressed();
      ghostPreview();
      input.focus();
    });
  }

  if (orToggle) {
    orToggle.addEventListener('click', (e) => {
      e.preventDefault();
      chosenOr = !chosenOr;
      syncOrTogglePressed();
      ghostPreview();
      input.focus();
    });
  }

  buildPills();
  syncQuoteToggleEnabled();
  syncNotTogglePressed();
  syncOrTogglePressed();

  // Rebuild pills whenever the engine switches so the user sees the right
  // operator surface for the active engine. The chosen-op reset and quote
  // toggle are handled inside buildPills/refresh.
  if (engine && typeof engine.on === 'function') {
    engine.on(() => {
      buildPills();
      syncQuoteToggleEnabled();
      refresh();
    });
  }

  // On language change, re-paint the static labels (placeholder, button text,
  // hints) and rebuild the pill list (its labels are i18n keys resolved at
  // build time).
  if (lang && typeof lang.on === 'function') {
    lang.on(() => {
      paintStaticStrings();
      buildPills();
      refresh();
    });
  }

  // React to chip state changes (e.g. so the input refocuses smoothly when
  // chips are deleted via Backspace and the user is mid-typing).
  refresh();

  return {
    focus() { input.focus(); },
    clear() { input.value = ''; refresh(); },
    drawerTrigger: host.querySelector('#composer-btn-add'),
  };
}
