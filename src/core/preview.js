import { t } from '../i18n/messages.js';

// Live query preview, copy-to-clipboard, Google search redirect, and the
// two-tap inline reset confirmation.
//
// `postRenderHooks` is the hook list passed by reference; consumers may push
// callbacks onto it that run after every render() pass. Used by cross-field
// warnings that depend on the rendered query string.

/**
 * @param {object} args
 * @param {HTMLElement} args.previewBox
 * @param {HTMLButtonElement} args.copyBtn
 * @param {HTMLButtonElement} args.searchBtn
 * @param {HTMLButtonElement} args.resetBtn
 * @param {HTMLElement} args.toastEl
 * @param {() => string} args.assembleQuery
 * @param {{ clearAll: () => void }} args.warnings
 * @param {{ clearAll: () => void }} args.tips
 * @param {() => Array<{ kind: string, text: string, chipId?: string }>} [args.getQueryFragments]
 *        Optional structured fragment list. When supplied, the preview wraps
 *        each chip's contribution in a <span data-chip-id="..."> so callers
 *        can highlight a specific chip's fragment via highlightChip(id).
 * @param {(q: string) => string} [args.getSearchUrl] - resolves the search-engine URL
 *        for the current query string. Defaults to Google.
 * @param {string} [args.emptyMessage]
 * @param {Array<() => void>} [args.postRenderHooks]
 * @param {Array<() => void>} [args.onResetHooks] - callbacks fired on the second tap of the global reset
 */
export function createPreview({
  previewBox, copyBtn, searchBtn, resetBtn, toastEl,
  assembleQuery, warnings, tips,
  getQueryFragments,
  getSearchUrl,
  emptyMessage = '',
  postRenderHooks = [],
  onResetHooks = [],
}) {
  const resolveSearchUrl = typeof getSearchUrl === 'function'
    ? getSearchUrl
    : (q) => 'https://www.google.com/search?q=' + encodeURIComponent(q);
  let emptyMsg = emptyMessage;
  function setEmptyMessage(m) { if (typeof m === 'string' && m) emptyMsg = m; }
  function render() {
    const q = assembleQuery();
    if (!q) {
      previewBox.textContent = emptyMsg;
      previewBox.classList.add('empty');
      copyBtn.disabled = true;
      searchBtn.disabled = true;
    } else {
      renderFragments(q);
      previewBox.classList.remove('empty');
      copyBtn.disabled = false;
      searchBtn.disabled = false;
    }
    postRenderHooks.forEach(hook => {
      try { hook(); } catch (e) { console.warn('post-render hook failed', e); }
    });
  }

  function renderFragments(fallbackText) {
    if (typeof getQueryFragments !== 'function') {
      previewBox.textContent = fallbackText;
      return;
    }
    const frags = getQueryFragments();
    if (!frags || frags.length === 0) {
      // Engine returned no structured fragments (e.g. Facebook URL) —
      // render the assembled query verbatim instead of clearing the box.
      previewBox.textContent = fallbackText;
      return;
    }
    while (previewBox.firstChild) previewBox.removeChild(previewBox.firstChild);
    frags.forEach(f => {
      if (f.kind === 'chip' && f.chipId) {
        const span = document.createElement('span');
        span.className = 'preview-frag';
        span.dataset.chipId = f.chipId;
        span.textContent = f.text;
        previewBox.appendChild(span);
      } else {
        previewBox.appendChild(document.createTextNode(f.text));
      }
    });
  }

  /**
   * Briefly highlight the preview span tagged with `chipId`. Used by
   * chip-area to show the visual link between a just-added or just-focused
   * chip and the preview text it produces.
   */
  function highlightChip(chipId) {
    if (!chipId) return;
    const span = previewBox.querySelector(`.preview-frag[data-chip-id="${chipId}"]`);
    if (!span) return;
    span.classList.add('preview-frag-active');
    clearTimeout(span._previewHighlightTimer);
    span._previewHighlightTimer = setTimeout(() => {
      span.classList.remove('preview-frag-active');
    }, 600);
  }

  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('visible');
    setTimeout(() => toastEl.classList.remove('visible'), 1500);
  }

  copyBtn.addEventListener('click', async () => {
    const q = previewBox.textContent;
    let copied = false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(q);
        copied = true;
      }
    } catch (e) { /* fallthrough */ }
    if (!copied) {
      try {
        const ta = document.createElement('textarea');
        ta.value = q;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        copied = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (e) { /* fallthrough */ }
    }
    if (copied) {
      const original = copyBtn.textContent;
      copyBtn.textContent = t('app.copyBtnDone');
      setTimeout(() => { copyBtn.textContent = original; }, 1500);
    } else {
      showToast(t('app.copyFailed'));
    }
  });

  searchBtn.addEventListener('click', () => {
    const q = previewBox.textContent;
    if (!q) return;
    const url = resolveSearchUrl(q);
    window.open(url, '_blank', 'noopener,noreferrer');
  });

  let resetArmed = false;
  let resetTimer = null;
  resetBtn.addEventListener('click', () => {
    if (!resetArmed) {
      resetArmed = true;
      resetBtn.textContent = t('app.resetBtnConfirm');
      resetTimer = setTimeout(() => {
        resetArmed = false;
        resetBtn.textContent = t('app.resetBtn');
      }, 3000);
    } else {
      clearTimeout(resetTimer);
      resetArmed = false;
      resetBtn.textContent = t('app.resetBtn');
      // Run reset hooks (chip-state.clear etc.).
      onResetHooks.forEach(hook => { try { hook(); } catch (e) { console.warn('reset hook failed', e); } });
      // Clear all warnings and tips too.
      warnings.clearAll();
      tips.clearAll();
      render();
    }
  });

  return { render, showToast, highlightChip, setEmptyMessage };
}
