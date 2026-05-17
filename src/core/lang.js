// UI language controller. Mirrors src/core/mode.js — singleton state +
// listener fan-out + body-class flip. The active language drives every
// label, placeholder, validation message, and tip in the app.
//
// State is in-memory only (refresh resets to Japanese, the primary audience).
// Switching language preserves chip state and form state — only the
// presentation changes. Japanese is LTR, so unlike the Arabic fork there is
// no RTL flip path; `dir="ltr"` stays put across both UI languages.

let activeLang = 'ja';
const listeners = [];

/**
 * @param {object} args
 * @param {HTMLButtonElement} args.btnJa
 * @param {HTMLButtonElement} args.btnEn
 * @param {HTMLElement} args.body
 * @param {HTMLElement} [args.html]
 * @param {'ja' | 'en'} [args.initial='ja']
 */
export function createLangController({ btnJa, btnEn, body, html, initial = 'ja' }) {
  const htmlEl = html || document.documentElement;
  activeLang = initial;
  applyDom();

  function applyDom() {
    if (htmlEl) {
      htmlEl.lang = activeLang;
      htmlEl.dir = 'ltr';
    }
    if (body) {
      body.classList.toggle('lang-ja', activeLang === 'ja');
      body.classList.toggle('lang-en', activeLang === 'en');
    }
    if (btnJa) btnJa.setAttribute('aria-pressed', activeLang === 'ja' ? 'true' : 'false');
    if (btnEn) btnEn.setAttribute('aria-pressed', activeLang === 'en' ? 'true' : 'false');
  }

  function set(lang) {
    if (lang !== 'ja' && lang !== 'en') return;
    if (lang === activeLang) return;
    activeLang = lang;
    applyDom();
    listeners.forEach(cb => { try { cb(activeLang); } catch (e) { console.warn('lang listener failed', e); } });
  }

  function get() { return activeLang; }
  function on(cb) { if (typeof cb === 'function') listeners.push(cb); }

  if (btnJa) btnJa.addEventListener('click', () => set('ja'));
  if (btnEn) btnEn.addEventListener('click', () => set('en'));

  return { get, set, on };
}

// Module-level accessor so i18n.js (and any consumer that doesn't receive
// ctx) can read the active language. Until createLangController runs we
// return 'ja' so first-paint strings come out as Japanese.
export function getActiveLang() {
  return activeLang;
}
