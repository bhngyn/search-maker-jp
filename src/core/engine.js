// Search-engine controller. The app supports four target search engines:
// Google, X / Twitter, Facebook (form-based), and Yahoo! JAPAN. Most of
// the UI is engine-agnostic: chip state, OR grouping, the composer, the
// drawer, the sticky preview, the warnings/tips infrastructure, etc.
//
// The engine descriptor — exported as the default export of each
// `src/engines/<id>.js` — supplies the parts that genuinely differ:
//
//   {
//     id, label,
//     labels: { subtitle, searchBtnLabel, emptyPreview },
//     searchUrl(query): string,
//     keywordOperators: { [opKey]: OperatorDescriptor },
//     keywordOperatorOrder: string[],          // dropdown order
//     composerPills: [{ op, label }, ...],
//     drawer: {
//       items: { [key]: DrawerItem },
//       beginnerOrder: string[], beginnerMore: string[],
//       advancedKeywords: string[], advancedSpecials: string[],
//     },
//     templates: [{ id, title, description, icon, apply(chipState) }],
//     dateRangeOps: { after, before },         // 'after'/'before' | 'since'/'until'
//     addableChipTypes: Set<string>,           // chip types that show up in drawer
//     nonLatinForbiddenOps: Set<string>,       // ops that warn on non-ASCII (e.g. Japanese) chars
//     multiWordOps: Set<string>,               // ops that warn on unquoted multi-word
//     parser: {
//       keywordOperators: Set<string>,        // ops the paste parser recognizes
//       prefixOperators: { [char]: opKey },   // '@' → 'mention', '#' → 'hashtag', ...
//     },
//   }
//
// `OperatorDescriptor` shape (what keyword.js consumes):
//   {
//     label: string,            // i18n key for dropdown label
//     opName: string,           // Latin operator name ('site') or '' for plain
//     dir: 'ltr' | 'auto',
//     normalizes: boolean,
//     quotable: boolean,
//     acceptsArabic: boolean,   // legacy name; semantically "accepts non-Latin text"
//     format?: (value: string) => string,   // override 'op:value' (e.g. '@user')
//     badge?: string,           // override the LTR badge (default: opName + ':')
//   }
//
// The engine controller keeps the active descriptor in memory only. Engine
// state never persists — refreshing the page resets to the default engine
// (Google), matching the no-persistence security constraint shared with
// the rest of the app.

let activeEngine = null;
const listeners = [];

/**
 * @param {object} args
 * @param {HTMLButtonElement} args.btnGoogle
 * @param {HTMLButtonElement} args.btnX
 * @param {HTMLButtonElement} [args.btnFacebook]
 * @param {HTMLButtonElement} [args.btnYahoojp]
 * @param {object} args.googleEngine - engine descriptor
 * @param {object} args.xEngine - engine descriptor
 * @param {object} [args.facebookEngine] - engine descriptor (optional)
 * @param {object} [args.yahoojpEngine] - engine descriptor (optional)
 * @param {string} [args.initialId='google']
 */
export function createEngineController({
  btnGoogle, btnX, btnFacebook, btnYahoojp,
  googleEngine, xEngine, facebookEngine, yahoojpEngine,
  initialId = 'google',
}) {
  const engines = { google: googleEngine, x: xEngine };
  if (facebookEngine) engines.facebook = facebookEngine;
  if (yahoojpEngine)  engines.yahoojp  = yahoojpEngine;
  activeEngine = engines[initialId] || googleEngine;

  function syncButtons() {
    if (btnGoogle)   btnGoogle.setAttribute('aria-pressed',   activeEngine.id === 'google'   ? 'true' : 'false');
    if (btnX)        btnX.setAttribute('aria-pressed',        activeEngine.id === 'x'        ? 'true' : 'false');
    if (btnFacebook) btnFacebook.setAttribute('aria-pressed', activeEngine.id === 'facebook' ? 'true' : 'false');
    if (btnYahoojp)  btnYahoojp.setAttribute('aria-pressed',  activeEngine.id === 'yahoojp'  ? 'true' : 'false');
  }

  function set(id) {
    const next = engines[id];
    if (!next || next === activeEngine) return;
    activeEngine = next;
    syncButtons();
    listeners.forEach(cb => { try { cb(activeEngine); } catch (e) { console.warn('engine listener failed', e); } });
  }

  function get() { return activeEngine.id; }
  function getActive() { return activeEngine; }
  function on(cb) { if (typeof cb === 'function') listeners.push(cb); }

  if (btnGoogle)   btnGoogle.addEventListener('click',   () => set('google'));
  if (btnX)        btnX.addEventListener('click',        () => set('x'));
  if (btnFacebook) btnFacebook.addEventListener('click', () => set('facebook'));
  if (btnYahoojp)  btnYahoojp.addEventListener('click',  () => set('yahoojp'));
  syncButtons();

  return { get, getActive, set, on };
}

// Module-level accessor so chip-type modules and other consumers that don't
// receive ctx can still read the active engine. This is set by
// createEngineController on construction and updated on every set(). Until
// the controller is constructed we return a no-op fallback that won't break
// imports.
export function getActiveEngine() {
  return activeEngine || FALLBACK;
}

// Conservative fallback used during module initialization (before the
// controller is wired). Mirrors enough of the descriptor surface to keep
// any premature read from throwing. Real values are installed by main.js.
const FALLBACK = {
  id: 'google',
  label: 'Google',
  labels: { subtitle: '', searchBtnLabel: '', emptyPreview: '' },
  searchUrl: q => 'https://www.google.com/search?q=' + encodeURIComponent(q || ''),
  keywordOperators: { none: { label: 'engine.google.op.none.label', opName: '', dir: 'auto', normalizes: true, quotable: true, acceptsArabic: true } },
  keywordOperatorOrder: ['none'],
  composerPills: [{ op: 'none', label: 'engine.google.pill.none' }],
  drawer: { items: {}, beginnerOrder: [], beginnerMore: [], advancedKeywords: [], advancedSpecials: [] },
  templates: [],
  dateRangeOps: { after: 'after', before: 'before' },
  addableChipTypes: new Set(['keyword', 'or-connector']),
  nonLatinForbiddenOps: new Set(),
  multiWordOps: new Set(),
  parser: { keywordOperators: new Set(), prefixOperators: {} },
};
