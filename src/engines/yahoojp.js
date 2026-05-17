// Yahoo! JAPAN search engine descriptor.
//
// Yahoo! JAPAN is dominant for an older demographic in Japan and indexes
// some .jp blogs, Q&A boards (知恵袋), and news Yahoo carries that Google
// undersamples. Its operator catalogue is a strict subset of Google's:
//
//   - site:       supported
//   - intitle:    supported
//   - intext:     supported
//   - inurl:      supported
//   - filetype:   supported (good PDF coverage on jp domains)
//   - inanchor:   UNRELIABLE — excluded
//   - before:/after:  NOT supported as query operators (Yahoo! exposes a
//                     date filter via URL params instead) — excluded
//   - AROUND(N):  not supported — proximity excluded
//   - N..M:       not supported — number-range excluded
//
// String fields are i18n keys, NOT literal strings — see src/i18n/messages.js
// and the docblock in src/engines/google.js.

import { IDIOMS, GROUP_ORDER, GROUP_LABELS } from '../idioms/yahoojp.js';

const keywordOperators = {
  none: {
    label: 'engine.yahoojp.op.none.label',
    opName: '',
    dir: 'auto',
    normalizes: true,
    quotable: true,
    acceptsArabic: true,
  },
  site: {
    label: 'engine.yahoojp.op.site.label',
    opName: 'site',
    dir: 'ltr',
    normalizes: false,
    quotable: false,
    acceptsArabic: false,
  },
  intitle: {
    label: 'engine.yahoojp.op.intitle.label',
    opName: 'intitle',
    dir: 'auto',
    normalizes: true,
    quotable: true,
    acceptsArabic: true,
  },
  intext: {
    label: 'engine.yahoojp.op.intext.label',
    opName: 'intext',
    dir: 'auto',
    normalizes: true,
    quotable: true,
    acceptsArabic: true,
  },
  inurl: {
    label: 'engine.yahoojp.op.inurl.label',
    opName: 'inurl',
    dir: 'ltr',
    normalizes: false,
    quotable: false,
    acceptsArabic: false,
  },
};

const composerPills = [
  { op: 'none', label: 'engine.yahoojp.pill.none' },
  { op: 'site', label: 'engine.yahoojp.pill.site' },
];

const drawerItems = {
  site:           { kind: 'keyword', operator: 'site',     label: 'engine.yahoojp.drawer.site.label',        desc: 'engine.yahoojp.drawer.site.desc',        badge: 'site:' },
  intitle:        { kind: 'keyword', operator: 'intitle',  label: 'engine.yahoojp.drawer.intitle.label',     desc: 'engine.yahoojp.drawer.intitle.desc',     badge: 'intitle:' },
  inurl:          { kind: 'keyword', operator: 'inurl',    label: 'engine.yahoojp.drawer.inurl.label',       desc: 'engine.yahoojp.drawer.inurl.desc',       badge: 'inurl:' },
  intext:         { kind: 'keyword', operator: 'intext',   label: 'engine.yahoojp.drawer.intext.label',      desc: 'engine.yahoojp.drawer.intext.desc',      badge: 'intext:' },
  filetype:       { kind: 'special', type: 'filetype',     label: 'engine.yahoojp.drawer.filetype.label',     desc: 'engine.yahoojp.drawer.filetype.desc',     badge: 'filetype:',         tier: 'beginner' },
};

const templates = [
  {
    id: 'site',
    title: 'engine.yahoojp.tpl.site.title',
    description: 'engine.yahoojp.tpl.site.desc',
    icon: '🌐',
    apply(chipState) {
      chipState.add('keyword', { operator: 'site', text: '' });
    },
  },
  {
    id: 'docs',
    title: 'engine.yahoojp.tpl.docs.title',
    description: 'engine.yahoojp.tpl.docs.desc',
    icon: '📄',
    apply(chipState) {
      chipState.add('filetype', { value: 'pdf' });
    },
  },
];

export default {
  id: 'yahoojp',
  label: 'Yahoo! Japan',
  labels: {
    subtitle: 'engine.yahoojp.subtitle',
    searchBtnLabel: 'engine.yahoojp.searchBtn',
    emptyPreview: 'engine.yahoojp.emptyPreview',
  },
  searchUrl: q => 'https://search.yahoo.co.jp/search?p=' + encodeURIComponent(q || '') + '&ei=UTF-8',
  keywordOperators,
  keywordOperatorOrder: ['none', 'site', 'intitle', 'intext', 'inurl'],
  composerPills,
  drawer: {
    items: drawerItems,
    beginnerOrder: ['filetype', 'site', 'intitle', 'intext', 'inurl'],
    beginnerMore: [],
    advancedKeywords: ['site', 'intitle', 'inurl', 'intext'],
    advancedSocial: [],
    advancedSpecials: ['filetype'],
  },
  templates,
  idioms: IDIOMS,
  idiomGroupOrder: GROUP_ORDER,
  idiomGroupLabels: GROUP_LABELS,
  // Yahoo! Japan does not support before:/after: query operators, but the
  // chip system reads dateRangeOps unconditionally during chip rendering.
  // We keep the keys present so chip-state stays well-formed even if a
  // user carried over a date-range chip from Google.
  dateRangeOps: { after: 'after', before: 'before' },
  addableChipTypes: new Set(['keyword', 'or-connector', 'filetype']),
  nonLatinForbiddenOps: new Set(['site', 'inurl']),
  multiWordOps: new Set(['intitle', 'intext']),
  parser: {
    keywordOperators: new Set(['site', 'intitle', 'intext', 'inurl']),
    prefixOperators: {},
  },
};
