// Google search engine descriptor.
//
// String fields (subtitle, operator labels, drawer labels, template titles,
// etc.) are i18n keys, NOT literal strings. Consumers resolve them via
// `t(key)` from src/i18n/messages.js so the descriptor can serve both the
// Arabic and English UI without duplicating structure per language.
//
// Engine descriptor shape is locked by `src/core/engine.js` — see the
// docblock there before changing this file.

import { IDIOMS, GROUP_ORDER, GROUP_LABELS } from '../idioms/google.js';

const keywordOperators = {
  none: {
    label: 'engine.google.op.none.label',
    opName: '',
    dir: 'auto',
    normalizes: true,
    quotable: true,
    acceptsArabic: true,
  },
  site: {
    label: 'engine.google.op.site.label',
    opName: 'site',
    dir: 'ltr',
    normalizes: false,
    quotable: false,
    acceptsArabic: false,
  },
  intitle: {
    label: 'engine.google.op.intitle.label',
    opName: 'intitle',
    dir: 'auto',
    normalizes: true,
    quotable: true,
    acceptsArabic: true,
  },
  intext: {
    label: 'engine.google.op.intext.label',
    opName: 'intext',
    dir: 'auto',
    normalizes: true,
    quotable: true,
    acceptsArabic: true,
  },
  inanchor: {
    label: 'engine.google.op.inanchor.label',
    opName: 'inanchor',
    dir: 'auto',
    normalizes: true,
    quotable: true,
    acceptsArabic: true,
  },
  inurl: {
    label: 'engine.google.op.inurl.label',
    opName: 'inurl',
    dir: 'ltr',
    normalizes: false,
    quotable: false,
    acceptsArabic: false,
  },
};

// Composer-pill row keeps only the two highest-frequency operators —
// plain word and site:. The remaining four (intitle, inurl, intext,
// inanchor) are still reachable via the "+ Search Operators" drawer.
const composerPills = [
  { op: 'none', label: 'engine.google.pill.none' },
  { op: 'site', label: 'engine.google.pill.site' },
];

const drawerItems = {
  site:           { kind: 'keyword', operator: 'site',     label: 'engine.google.drawer.site.label',        desc: 'engine.google.drawer.site.desc',        badge: 'site:' },
  intitle:        { kind: 'keyword', operator: 'intitle',  label: 'engine.google.drawer.intitle.label',     desc: 'engine.google.drawer.intitle.desc',     badge: 'intitle:' },
  inurl:          { kind: 'keyword', operator: 'inurl',    label: 'engine.google.drawer.inurl.label',       desc: 'engine.google.drawer.inurl.desc',       badge: 'inurl:' },
  intext:         { kind: 'keyword', operator: 'intext',   label: 'engine.google.drawer.intext.label',      desc: 'engine.google.drawer.intext.desc',      badge: 'intext:' },
  inanchor:       { kind: 'keyword', operator: 'inanchor', label: 'engine.google.drawer.inanchor.label',    desc: 'engine.google.drawer.inanchor.desc',    badge: 'inanchor:' },
  filetype:       { kind: 'special', type: 'filetype',     label: 'engine.google.drawer.filetype.label',     desc: 'engine.google.drawer.filetype.desc',     badge: 'filetype:',         tier: 'beginner' },
  'date-range':   { kind: 'special', type: 'date-range',   label: 'engine.google.drawer.dateRange.label',    desc: 'engine.google.drawer.dateRange.desc',    badge: 'before: / after:',  tier: 'beginner' },
  proximity:      { kind: 'special', type: 'proximity',    label: 'engine.google.drawer.proximity.label',    desc: 'engine.google.drawer.proximity.desc',    badge: 'AROUND(N)',         tier: 'advanced' },
  'number-range': { kind: 'special', type: 'number-range', label: 'engine.google.drawer.numberRange.label',  desc: 'engine.google.drawer.numberRange.desc',  badge: '..',                tier: 'advanced' },

  // Social-media site: shortcuts. Each commits a keyword chip with operator=site
  // and a prefilled `text` value; the user appends the channel/handle/path.
  'social-telegram':     { kind: 'keyword', operator: 'site', text: 't.me/',                 label: 'engine.google.drawer.social.telegram.label',     desc: 'engine.google.drawer.social.telegram.desc',     badge: 'site:t.me/' },
  'social-fb-groups':    { kind: 'keyword', operator: 'site', text: 'facebook.com/groups/',  label: 'engine.google.drawer.social.fb-groups.label',    desc: 'engine.google.drawer.social.fb-groups.desc',    badge: 'site:facebook.com/groups/' },
  'social-fb':           { kind: 'keyword', operator: 'site', text: 'facebook.com/',         label: 'engine.google.drawer.social.fb.label',           desc: 'engine.google.drawer.social.fb.desc',           badge: 'site:facebook.com/' },
  'social-x':            { kind: 'keyword', operator: 'site', text: 'x.com/',                label: 'engine.google.drawer.social.x.label',            desc: 'engine.google.drawer.social.x.desc',            badge: 'site:x.com/' },
  'social-linkedin':     { kind: 'keyword', operator: 'site', text: 'linkedin.com/',         label: 'engine.google.drawer.social.linkedin.label',     desc: 'engine.google.drawer.social.linkedin.desc',     badge: 'site:linkedin.com/' },
  'social-reddit':       { kind: 'keyword', operator: 'site', text: 'reddit.com/',           label: 'engine.google.drawer.social.reddit.label',       desc: 'engine.google.drawer.social.reddit.desc',       badge: 'site:reddit.com/' },
  'social-youtube':      { kind: 'keyword', operator: 'site', text: 'youtube.com/',          label: 'engine.google.drawer.social.youtube.label',      desc: 'engine.google.drawer.social.youtube.desc',      badge: 'site:youtube.com/' },
  'social-instagram':    { kind: 'keyword', operator: 'site', text: 'instagram.com/',        label: 'engine.google.drawer.social.instagram.label',    desc: 'engine.google.drawer.social.instagram.desc',    badge: 'site:instagram.com/' },
  'social-tiktok':       { kind: 'keyword', operator: 'site', text: 'tiktok.com/',           label: 'engine.google.drawer.social.tiktok.label',       desc: 'engine.google.drawer.social.tiktok.desc',       badge: 'site:tiktok.com/' },
};

const templates = [
  {
    id: 'site',
    title: 'engine.google.tpl.site.title',
    description: 'engine.google.tpl.site.desc',
    icon: '🌐',
    apply(chipState) {
      chipState.add('keyword', { operator: 'site', text: '' });
    },
  },
  {
    id: 'docs',
    title: 'engine.google.tpl.docs.title',
    description: 'engine.google.tpl.docs.desc',
    icon: '📄',
    apply(chipState) {
      chipState.add('filetype', { value: 'pdf' });
    },
  },
  {
    id: 'daterange',
    title: 'engine.google.tpl.daterange.title',
    description: 'engine.google.tpl.daterange.desc',
    icon: '📅',
    apply(chipState) {
      const today = new Date();
      const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
      const fmt = (d) => d.toISOString().slice(0, 10);
      chipState.add('date-range', { after: fmt(lastYear), before: fmt(today) });
    },
  },
];

export default {
  id: 'google',
  label: 'Google',
  labels: {
    subtitle: 'engine.google.subtitle',
    searchBtnLabel: 'engine.google.searchBtn',
    emptyPreview: 'engine.google.emptyPreview',
  },
  searchUrl: q => 'https://www.google.com/search?q=' + encodeURIComponent(q || ''),
  keywordOperators,
  keywordOperatorOrder: ['none', 'site', 'intitle', 'intext', 'inanchor', 'inurl'],
  composerPills,
  drawer: {
    items: drawerItems,
    beginnerOrder: ['date-range', 'filetype', 'site', 'intitle', 'intext', 'inurl', 'inanchor'],
    beginnerMore: ['proximity', 'number-range'],
    advancedKeywords: ['site', 'intitle', 'inurl', 'intext', 'inanchor'],
    advancedSocial: ['social-telegram', 'social-fb-groups', 'social-fb', 'social-x', 'social-linkedin', 'social-reddit', 'social-youtube', 'social-instagram', 'social-tiktok'],
    advancedSpecials: ['filetype', 'date-range', 'proximity', 'number-range'],
  },
  templates,
  idioms: IDIOMS,
  idiomGroupOrder: GROUP_ORDER,
  idiomGroupLabels: GROUP_LABELS,
  dateRangeOps: { after: 'after', before: 'before' },
  addableChipTypes: new Set(['keyword', 'or-connector', 'filetype', 'date-range', 'proximity', 'number-range']),
  nonLatinForbiddenOps: new Set(['site', 'inurl']),
  multiWordOps: new Set(['intitle', 'intext', 'inanchor']),
  parser: {
    keywordOperators: new Set(['site', 'intitle', 'intext', 'inanchor', 'inurl']),
    prefixOperators: {},
  },
};
