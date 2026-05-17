// Auto-generated "Build it manually" step list.
//
// `explainAnatomy(captured, engine)` walks the chip array produced by
// captureAnatomy() and returns an array of { key, vars } step descriptors.
// The renderer (W3, src/ui/idiom-panel.js) resolves each step via
//   t(step.key, step.vars)
// and then splits the resolved string on [[...]] to wrap control names in
// <span class="idiom-control-mention"> pill markup.
//
// This module is PURE — no DOM, no t() calls, no side-effects. It does not
// import messages.js. All string-resolution responsibility belongs to the
// renderer so this file stays engine-agnostic and trivially testable.
//
// Control-name convention inside resolved strings (W2 must use these):
//   [[label text]]   → a named UI control, rendered as a mini-pill.
//   «text»           → user-supplied literal text the user types.
//
// Step keys produced and their interpolation vars (see W2 coordination block
// at the bottom of this file):
//
//   idiom.howto.keyword.plain     { text }
//   idiom.howto.keyword.withOp    { text, opLabelKey, opBadge }
//   idiom.howto.keyword.quoted    { text }
//   idiom.howto.keyword.negate    { text }
//   idiom.howto.keyword.negateOp  { text, opLabelKey, opBadge }
//   idiom.howto.or                (no vars)
//   idiom.howto.special.dateRange { after, before }
//   idiom.howto.special.filetype  { itemLabelKey, value }
//   idiom.howto.special.filter    { filterValue, negate }
//   idiom.howto.special.engagement { metric, direction, value }
//   idiom.howto.special.proximity  { term1, distance, term2 }
//   idiom.howto.special.numberRange { low, high, prefix }
//   idiom.howto.special.generic   { itemLabelKey }

// ---------------------------------------------------------------------------
// Drawer item lookup helpers
// ---------------------------------------------------------------------------

/**
 * Find the drawer item whose `type` matches a chip type. Works for
 * special-kind items (filetype, date-range, proximity, number-range,
 * engagement). For filter chips with specific values, also checks
 * item.props.value. Returns null if not found.
 *
 * @param {object} engine  — the active engine descriptor
 * @param {string} chipType
 * @param {object} chipProps
 * @returns {{ labelKey: string, badge: string }|null}
 */
function findDrawerItem(engine, chipType, chipProps) {
  const items = engine && engine.drawer && engine.drawer.items;
  if (!items) return null;

  // Filter chips: the X engine has per-value filter drawer items like
  // 'filter-images', 'filter-replies', etc. Try to find the most-specific
  // match first (matching both type and value), then fall back to any item
  // whose type field matches.
  const filterValue = chipProps && chipProps.value;

  let bestMatch = null;
  for (const [_key, item] of Object.entries(items)) {
    if (item.type !== chipType) continue;
    if (chipType === 'filter' && item.props && filterValue) {
      if (item.props.value === filterValue) {
        // Exact match on value — prefer this.
        bestMatch = item;
        break;
      }
    } else {
      // Non-filter special: first match wins.
      bestMatch = item;
      break;
    }
  }
  return bestMatch;
}

/**
 * Return the i18n label key for a drawer item. Drawer items store their
 * label as an i18n key string. We pass it through to vars.itemLabelKey so
 * the renderer can call t(itemLabelKey) to get the human-readable name.
 *
 * @param {object|null} drawerItem
 * @param {string} fallback  — chip type slug used if drawerItem is absent
 * @returns {string}
 */
function drawerItemLabelKey(drawerItem, fallback) {
  if (drawerItem && typeof drawerItem.label === 'string') {
    return drawerItem.label;
  }
  // Fallback: use the chip type label from the chip module. These are also
  // i18n keys (see each chip type's exported `label` constant).
  return fallback;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Walk a captured chip array and produce an ordered list of step descriptors
 * describing how to build the recipe manually using the chip composer's
 * controls.
 *
 * @param {Array<{id:string,type:string,props:object}>|null} captured
 *   Output of captureAnatomy(). Returns [] if null or empty.
 * @param {object} engine
 *   The active engine descriptor (src/engines/google.js or x.js export).
 *   Used to look up keyword operator labels and drawer item labels.
 * @returns {Array<{key:string,vars:object}>}
 */
export function explainAnatomy(captured, engine) {
  if (!captured || captured.length === 0) return [];

  const steps = [];
  const ops = (engine && engine.keywordOperators) || {};

  for (const chip of captured) {
    switch (chip.type) {

      // ── keyword chip ──────────────────────────────────────────────────────
      case 'keyword': {
        const opKey = chip.props.operator || 'none';
        const opDescriptor = ops[opKey];
        // The operator label is an i18n key stored in opDescriptor.label.
        const opLabelKey = (opDescriptor && opDescriptor.label) || 'engine.google.op.none.label';
        // The badge is the raw operator string shown in the UI (e.g. 'site:').
        const opBadge = (opDescriptor && (opDescriptor.badge || opDescriptor.opName))
          ? (opDescriptor.badge || opDescriptor.opName + ':')
          : null;
        const text = chip.props.text || '';
        const isNegate = !!chip.props.negate;
        const isQuoted = !!chip.props.quoted;
        const hasOp = opKey !== 'none';

        if (isNegate) {
          if (hasOp) {
            // Negated + with operator
            steps.push({
              key: 'idiom.howto.keyword.negateOp',
              vars: { text, opLabelKey, opBadge: opBadge || opKey + ':' },
            });
          } else {
            // Negated, no operator
            steps.push({
              key: 'idiom.howto.keyword.negate',
              vars: { text },
            });
          }
        } else if (isQuoted) {
          // Quoted, no operator (quoted + operator would require description too
          // but in practice quoted+op recipes use intitle/intext which support quotes)
          steps.push({
            key: 'idiom.howto.keyword.quoted',
            vars: { text, opLabelKey: hasOp ? opLabelKey : null, opBadge: hasOp ? opBadge : null },
          });
        } else if (hasOp) {
          steps.push({
            key: 'idiom.howto.keyword.withOp',
            vars: { text, opLabelKey, opBadge: opBadge || opKey + ':' },
          });
        } else {
          // Plain keyword
          steps.push({
            key: 'idiom.howto.keyword.plain',
            vars: { text },
          });
        }
        break;
      }

      // ── or-connector chip ─────────────────────────────────────────────────
      case 'or-connector': {
        steps.push({
          key: 'idiom.howto.or',
          vars: {},
        });
        break;
      }

      // ── date-range chip ───────────────────────────────────────────────────
      case 'date-range': {
        steps.push({
          key: 'idiom.howto.special.dateRange',
          vars: {
            after:  chip.props.after  || '',
            before: chip.props.before || '',
            // Pass the drawer item label key so the renderer can render the
            // drawer entry name in the instructions.
            itemLabelKey: drawerItemLabelKey(
              findDrawerItem(engine, 'date-range', chip.props),
              'engine.google.drawer.dateRange.label',
            ),
          },
        });
        break;
      }

      // ── filetype chip ─────────────────────────────────────────────────────
      case 'filetype': {
        steps.push({
          key: 'idiom.howto.special.filetype',
          vars: {
            value: chip.props.value || '',
            itemLabelKey: drawerItemLabelKey(
              findDrawerItem(engine, 'filetype', chip.props),
              'engine.google.drawer.filetype.label',
            ),
          },
        });
        break;
      }

      // ── filter chip (X engine) ────────────────────────────────────────────
      case 'filter': {
        const filterValue = chip.props.value || '';
        const isNegated = !!chip.props.negate;
        // Try to find the most-specific drawer item label for this filter value.
        const drawerItem = findDrawerItem(engine, 'filter', chip.props);
        steps.push({
          key: 'idiom.howto.special.filter',
          vars: {
            filterValue,
            negate: isNegated,
            itemLabelKey: drawerItemLabelKey(drawerItem, 'engine.x.drawer.filter.label'),
          },
        });
        break;
      }

      // ── engagement chip (X engine) ────────────────────────────────────────
      case 'engagement': {
        steps.push({
          key: 'idiom.howto.special.engagement',
          vars: {
            metric:    chip.props.metric    || 'min_faves',
            direction: chip.props.direction || 'min',
            value:     chip.props.value     ?? 100,
            itemLabelKey: drawerItemLabelKey(
              findDrawerItem(engine, 'engagement', chip.props),
              'engine.x.drawer.engagement.label',
            ),
          },
        });
        break;
      }

      // ── proximity chip (Google) ───────────────────────────────────────────
      case 'proximity': {
        steps.push({
          key: 'idiom.howto.special.proximity',
          vars: {
            term1:    chip.props.term1    || '',
            distance: chip.props.distance ?? 5,
            term2:    chip.props.term2    || '',
            itemLabelKey: drawerItemLabelKey(
              findDrawerItem(engine, 'proximity', chip.props),
              'engine.google.drawer.proximity.label',
            ),
          },
        });
        break;
      }

      // ── number-range chip (Google) ────────────────────────────────────────
      case 'number-range': {
        steps.push({
          key: 'idiom.howto.special.numberRange',
          vars: {
            low:    chip.props.low    || '',
            high:   chip.props.high   || '',
            prefix: chip.props.prefix || '',
            itemLabelKey: drawerItemLabelKey(
              findDrawerItem(engine, 'number-range', chip.props),
              'engine.google.drawer.numberRange.label',
            ),
          },
        });
        break;
      }

      // ── unknown / future chip types ───────────────────────────────────────
      default: {
        const drawerItem = findDrawerItem(engine, chip.type, chip.props);
        steps.push({
          key: 'idiom.howto.special.generic',
          vars: {
            itemLabelKey: drawerItemLabelKey(drawerItem, chip.type),
          },
        });
        break;
      }
    }
  }

  return steps;
}

// ---------------------------------------------------------------------------
// Dev-only self-check (runs once at module load, ~5ms)
// ---------------------------------------------------------------------------
//
// Coordination note for W2: the exact i18n keys referenced as step.key
// values are listed in the COORDINATION OUTPUT section at the very bottom
// of this file. W2 must add Arabic + English strings for all of them.

/* eslint-disable no-console */
(function devCheck() {
  const isDev = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV);
  if (!isDev) return;

  Promise.all([
    import('./sandbox.js'),
    import('./google.js'),
    import('./x.js'),
    import('../engines/google.js'),
    import('../engines/x.js'),
  ]).then(([sandboxMod, googleIdiomsmod, xIdiomsMod, googleEngine, xEngine]) => {
    const { captureAnatomy } = sandboxMod;
    const testCases = [
      { engine: googleEngine.default, idioms: googleIdiomsmod.IDIOMS, ids: ['subdomain-discovery', 'jp-gov-tld-chain'] },
      { engine: xEngine.default,      idioms: xIdiomsMod.IDIOMS,      ids: ['first-source', 'cross-script-name'] },
    ];
    for (const { engine, idioms, ids } of testCases) {
      for (const id of ids) {
        const idiom = idioms.find(i => i.id === id);
        if (!idiom) {
          console.warn('[idiom-explain] DEV CHECK: idiom not found —', engine.id, id);
          continue;
        }
        const captured = captureAnatomy(idiom, { noCache: true });
        const steps    = explainAnatomy(captured, engine);
        if (!steps || steps.length === 0) {
          console.warn(
            '[idiom-explain] DEV CHECK: explainAnatomy returned empty steps for',
            engine.id, id,
            '(captured:', captured ? captured.length : 'null', 'chips)',
          );
        } else {
          console.debug(
            '[idiom-explain] DEV CHECK OK:', engine.id, id,
            '→', steps.length, 'steps:',
            steps.map(s => s.key).join(', '),
          );
        }
      }
    }
  }).catch(err => {
    console.warn('[idiom-explain] DEV CHECK: failed to load modules', err);
  });
})();

// ---------------------------------------------------------------------------
// COORDINATION OUTPUT for W2
// ---------------------------------------------------------------------------
//
// The following i18n keys are referenced by explainAnatomy()'s return values.
// W2 must add Arabic (ar) and English (en) strings for every key below.
// Interpolation vars use {curly braces} per the existing t() convention.
//
// Keys that produce a resolved string containing [[...]] control-name markers
// are noted. W3 splits on [[...]] to render pill spans.
//
// ── keyword chips ───────────────────────────────────────────────────────────
//
//  'idiom.howto.keyword.plain'
//    vars: { text }
//    ar: اكتب «{text}» في حقل الكلمة، ثم اضغط [[Enter]] أو زر [[أضف]].
//    en: Type «{text}» in the word field, then press [[Enter]] or [[Add]].
//    (when text is empty / placeholder)
//    ar (empty): اكتب مصطلح البحث في حقل الكلمة، ثم اضغط [[Enter]] أو زر [[أضف]].
//    en (empty): Type your search term, then press [[Enter]] or [[Add]].
//    NOTE: W2 can handle empty text with a function form: (vars) => vars.text ? ... : ...
//
//  'idiom.howto.keyword.withOp'
//    vars: { text, opLabelKey, opBadge }
//    (opLabelKey is itself an i18n key — renderer resolves it separately)
//    ar: اكتب «{text}»، اختر [[{opBadge}]] من شريط المؤشرات أو قائمة [[+ إضافة]]، ثم [[Enter]].
//    en: Type «{text}», pick [[{opBadge}]] from the operator pills or [[+ Add]], then [[Enter]].
//    NOTE: {opBadge} is a raw string like 'site:' or '@'. The renderer wraps it in a pill.
//    NOTE: if text is empty, phrase changes to "اكتب المصطلح المناسب".
//
//  'idiom.howto.keyword.quoted'
//    vars: { text, opLabelKey, opBadge }  (opLabelKey / opBadge may be null for plain-quoted)
//    ar: اكتب «{text}»، فعّل [[اقتباس حرفي]]، ثم [[Enter]].
//    en: Type «{text}», enable [[Literal match]], then [[Enter]].
//    (when opLabelKey present, add: ", then pick [[{opBadge}]] from the operator pills")
//
//  'idiom.howto.keyword.negate'
//    vars: { text }
//    ar: اكتب «{text}»، اضغط [[− NOT]] قبل الإضافة، أو ابدأ بـ«-» في حقل الكلمة.
//    en: Type «{text}», press [[− NOT]] before adding, or start the word with «-».
//
//  'idiom.howto.keyword.negateOp'
//    vars: { text, opLabelKey, opBadge }
//    ar: اكتب «{text}»، اختر [[{opBadge}]] من القائمة، ثم اضغط [[− NOT]].
//    en: Type «{text}», pick [[{opBadge}]], then press [[− NOT]].
//
// ── or-connector ────────────────────────────────────────────────────────────
//
//  'idiom.howto.or'
//    vars: {}
//    ar: اضغط [[+أو]] على الكلمة السابقة لإضافتها إلى مجموعة بدائل.
//    en: Press [[+OR]] on the previous term to start an alternatives group.
//
// ── special chips ────────────────────────────────────────────────────────────
//
//  'idiom.howto.special.dateRange'
//    vars: { after, before, itemLabelKey }
//    ar: اضغط [[+ إضافة]]، اختر [[نطاق زمني]]، أدخل التواريخ المطلوبة.
//    en: Press [[+ Add]], choose [[Date range]], then enter the desired dates.
//    (when after is non-empty: append "تاريخ «بعد»: {after}")
//    (when before is non-empty: append "تاريخ «قبل»: {before}")
//    NOTE: itemLabelKey is an i18n key; renderer resolves it for the [[...]] pill label.
//
//  'idiom.howto.special.filetype'
//    vars: { value, itemLabelKey }
//    ar: اضغط [[+ إضافة]]، اختر [[نوع الملف]]، ثم اختر «{value}» من القائمة.
//    en: Press [[+ Add]], choose [[File type]], then pick «{value}» from the list.
//
//  'idiom.howto.special.filter'
//    vars: { filterValue, negate, itemLabelKey }
//    ar (negate=false): اضغط [[+ إضافة]]، اختر [[تصفية بنوع التغريدة]]، حدّد «{filterValue}».
//    ar (negate=true):  اضغط [[+ إضافة]]، اختر [[تصفية بنوع التغريدة]]، حدّد «{filterValue}»، ثم فعّل [[− NOT]].
//    en (negate=false): Press [[+ Add]], choose [[Filter by tweet type]], select «{filterValue}».
//    en (negate=true):  Press [[+ Add]], choose [[Filter by tweet type]], select «{filterValue}», then enable [[− NOT]].
//    NOTE: itemLabelKey resolves to the specific filter option label if available.
//
//  'idiom.howto.special.engagement'
//    vars: { metric, direction, value, itemLabelKey }
//    ar: اضغط [[+ إضافة]]، اختر [[حد أدنى/أقصى للتفاعل]]، اختر نوع التفاعل «{metric}» وأدخل القيمة {value}.
//    en: Press [[+ Add]], choose [[Engagement threshold]], pick metric «{metric}» and enter {value}.
//
//  'idiom.howto.special.proximity'
//    vars: { term1, distance, term2, itemLabelKey }
//    ar: اضغط [[+ إضافة]]، اختر [[كلمتان متقاربتان]]، أدخل الكلمتين «{term1}» و«{term2}» مع مسافة {distance}.
//    en: Press [[+ Add]], choose [[Two nearby words]], enter «{term1}» and «{term2}» with distance {distance}.
//
//  'idiom.howto.special.numberRange'
//    vars: { low, high, prefix, itemLabelKey }
//    ar: اضغط [[+ إضافة]]، اختر [[نطاق عددي]]، أدخل الحد الأدنى {low} والأقصى {high}.
//    en: Press [[+ Add]], choose [[Number range]], enter min {low} and max {high}.
//
//  'idiom.howto.special.generic'
//    vars: { itemLabelKey }
//    ar: اضغط [[+ إضافة]] واختر الخيار المطلوب من القائمة.
//    en: Press [[+ Add]] and choose the appropriate option from the list.
