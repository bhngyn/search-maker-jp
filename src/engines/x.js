// X / Twitter search engine descriptor.
//
// String fields are i18n keys, NOT literal strings — see src/i18n/messages.js
// and the docblock in src/engines/google.js.

import { IDIOMS, GROUP_ORDER, GROUP_LABELS } from '../idioms/x.js';

const keywordOperators = {
  none: {
    label: 'engine.x.op.none.label',
    opName: '',
    dir: 'auto',
    normalizes: true,
    quotable: true,
    acceptsArabic: true,
  },
  from: {
    label: 'engine.x.op.from.label',
    opName: 'from',
    dir: 'ltr',
    normalizes: false,
    quotable: false,
    acceptsArabic: false,
  },
  to: {
    label: 'engine.x.op.to.label',
    opName: 'to',
    dir: 'ltr',
    normalizes: false,
    quotable: false,
    acceptsArabic: false,
  },
  mention: {
    label: 'engine.x.op.mention.label',
    opName: 'mention',
    dir: 'ltr',
    normalizes: false,
    quotable: false,
    acceptsArabic: false,
    format: v => '@' + v,
    badge: '@',
  },
  hashtag: {
    label: 'engine.x.op.hashtag.label',
    opName: 'hashtag',
    dir: 'auto',
    normalizes: true,
    quotable: false,
    acceptsArabic: true,
    format: v => '#' + v,
    badge: '#',
  },
  url: {
    label: 'engine.x.op.url.label',
    opName: 'url',
    dir: 'ltr',
    normalizes: false,
    quotable: false,
    acceptsArabic: false,
  },
  list: {
    label: 'engine.x.op.list.label',
    opName: 'list',
    dir: 'ltr',
    normalizes: false,
    quotable: false,
    acceptsArabic: false,
  },
  lang: {
    label: 'engine.x.op.lang.label',
    opName: 'lang',
    dir: 'ltr',
    normalizes: false,
    quotable: false,
    acceptsArabic: false,
  },
  near: {
    label: 'engine.x.op.near.label',
    opName: 'near',
    dir: 'ltr',
    normalizes: false,
    quotable: false,
    acceptsArabic: false,
  },
  source: {
    label: 'engine.x.op.source.label',
    opName: 'source',
    dir: 'ltr',
    normalizes: false,
    quotable: false,
    acceptsArabic: false,
  },
  conversation_id: {
    label: 'engine.x.op.conversation_id.label',
    opName: 'conversation_id',
    dir: 'ltr',
    normalizes: false,
    quotable: false,
    acceptsArabic: false,
  },
  quoted_tweet_id: {
    label: 'engine.x.op.quoted_tweet_id.label',
    opName: 'quoted_tweet_id',
    dir: 'ltr',
    normalizes: false,
    quotable: false,
    acceptsArabic: false,
  },
};

const composerPills = [
  { op: 'none',    label: 'engine.x.pill.none' },
  { op: 'from',    label: 'engine.x.pill.from' },
  { op: 'to',      label: 'engine.x.pill.to' },
  { kind: 'instant', type: 'filter',     props: { value: 'images', negate: false }, label: 'engine.x.pill.filterImages', badge: 'filter:images' },
  { kind: 'instant', type: 'filter',     props: { value: 'videos', negate: false }, label: 'engine.x.pill.filterVideos', badge: 'filter:videos' },
  { kind: 'instant', type: 'date-range', props: {},                                  label: 'engine.x.pill.dateRange',    badge: 'since: / until:' },
];

const drawerItems = {
  from:            { kind: 'keyword', operator: 'from',            label: 'engine.x.drawer.from.label',            desc: 'engine.x.drawer.from.desc',            badge: 'from:',     tier: 'beginner' },
  to:              { kind: 'keyword', operator: 'to',              label: 'engine.x.drawer.to.label',              desc: 'engine.x.drawer.to.desc',              badge: 'to:',       tier: 'beginner' },
  mention:         { kind: 'keyword', operator: 'mention',         label: 'engine.x.drawer.mention.label',         desc: 'engine.x.drawer.mention.desc',         badge: '@',         tier: 'beginner' },
  hashtag:         { kind: 'keyword', operator: 'hashtag',         label: 'engine.x.drawer.hashtag.label',         desc: 'engine.x.drawer.hashtag.desc',         badge: '#',         tier: 'beginner' },
  list:            { kind: 'keyword', operator: 'list',            label: 'engine.x.drawer.list.label',            desc: 'engine.x.drawer.list.desc',            badge: 'list:',     tier: 'beginner' },
  url:             { kind: 'keyword', operator: 'url',             label: 'engine.x.drawer.url.label',             desc: 'engine.x.drawer.url.desc',             badge: 'url:',      tier: 'beginner' },
  lang:            { kind: 'keyword', operator: 'lang',            label: 'engine.x.drawer.lang.label',            desc: 'engine.x.drawer.lang.desc',            badge: 'lang:',     tier: 'beginner' },
  near:            { kind: 'keyword', operator: 'near',            label: 'engine.x.drawer.near.label',            desc: 'engine.x.drawer.near.desc',            badge: 'near:',     tier: 'beginner' },
  source:          { kind: 'keyword', operator: 'source',          label: 'engine.x.drawer.source.label',          desc: 'engine.x.drawer.source.desc',          badge: 'source:',   tier: 'beginner' },
  conversation_id: { kind: 'keyword', operator: 'conversation_id', label: 'engine.x.drawer.conversation_id.label', desc: 'engine.x.drawer.conversation_id.desc', badge: 'conv_id:',  tier: 'advanced' },
  quoted_tweet_id: { kind: 'keyword', operator: 'quoted_tweet_id', label: 'engine.x.drawer.quoted_tweet_id.label', desc: 'engine.x.drawer.quoted_tweet_id.desc', badge: 'quoted:',   tier: 'advanced' },
  'date-range':    { kind: 'special', type: 'date-range',          label: 'engine.x.drawer.dateRange.label',       desc: 'engine.x.drawer.dateRange.desc',       badge: 'since: / until:', tier: 'beginner' },
  'filter-media':         { kind: 'special', type: 'filter', props: { value: 'media',          negate: false }, label: 'chip.filter.opt.media',          badge: 'filter:media',          tier: 'beginner' },
  'filter-images':        { kind: 'special', type: 'filter', props: { value: 'images',         negate: false }, label: 'chip.filter.opt.images',         badge: 'filter:images',         tier: 'beginner' },
  'filter-videos':        { kind: 'special', type: 'filter', props: { value: 'videos',         negate: false }, label: 'chip.filter.opt.videos',         badge: 'filter:videos',         tier: 'beginner' },
  'filter-links':         { kind: 'special', type: 'filter', props: { value: 'links',          negate: false }, label: 'chip.filter.opt.links',          badge: 'filter:links',          tier: 'beginner' },
  'filter-replies':       { kind: 'special', type: 'filter', props: { value: 'replies',        negate: false }, label: 'chip.filter.opt.replies',        badge: 'filter:replies',        tier: 'beginner' },
  'filter-quote':         { kind: 'special', type: 'filter', props: { value: 'quote',          negate: false }, label: 'chip.filter.opt.quote',          badge: 'filter:quote',          tier: 'beginner' },
  'filter-nativeretweets':{ kind: 'special', type: 'filter', props: { value: 'nativeretweets', negate: false }, label: 'chip.filter.opt.nativeretweets', badge: 'filter:nativeretweets', tier: 'beginner' },
  'filter-verified':      { kind: 'special', type: 'filter', props: { value: 'verified',       negate: false }, label: 'chip.filter.opt.verified',       badge: 'filter:verified',       tier: 'beginner' },
  'filter-has_engagement':{ kind: 'special', type: 'filter', props: { value: 'has_engagement', negate: false }, label: 'chip.filter.opt.has_engagement', badge: 'filter:has_engagement', tier: 'advanced' },
  // Engagement thresholds — one drawer entry per metric so the user picks
  // the dimension up front instead of opening a generic chip and changing
  // its dropdown. Each pre-seeds `props.metric`; the chip still lets the
  // user adjust the threshold value or flip min↔max after commit.
  'engagement-faves':    { kind: 'special', type: 'engagement', props: { metric: 'min_faves',    direction: 'min', value: 100 }, label: 'engine.x.drawer.engagement.faves.label',    desc: 'engine.x.drawer.engagement.faves.desc',    badge: 'min_faves:',    tier: 'beginner' },
  'engagement-replies':  { kind: 'special', type: 'engagement', props: { metric: 'min_replies',  direction: 'min', value: 50  }, label: 'engine.x.drawer.engagement.replies.label',  desc: 'engine.x.drawer.engagement.replies.desc',  badge: 'min_replies:',  tier: 'beginner' },
  'engagement-retweets': { kind: 'special', type: 'engagement', props: { metric: 'min_retweets', direction: 'min', value: 100 }, label: 'engine.x.drawer.engagement.retweets.label', desc: 'engine.x.drawer.engagement.retweets.desc', badge: 'min_retweets:', tier: 'beginner' },
};

const templates = [
  {
    id: 'account',
    title: 'engine.x.tpl.account.title',
    description: 'engine.x.tpl.account.desc',
    icon: '👤',
    apply(chipState) {
      chipState.add('keyword', { operator: 'from', text: '' });
    },
  },
  {
    id: 'popular',
    title: 'engine.x.tpl.popular.title',
    description: 'engine.x.tpl.popular.desc',
    icon: '🔥',
    apply(chipState) {
      chipState.add('engagement', { metric: 'min_faves', direction: 'min', value: 1000 });
    },
  },
  {
    id: 'daterange',
    title: 'engine.x.tpl.daterange.title',
    description: 'engine.x.tpl.daterange.desc',
    icon: '📅',
    apply(chipState) {
      const today = new Date();
      const past = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const fmt = (d) => d.toISOString().slice(0, 10);
      chipState.add('date-range', { after: fmt(past), before: fmt(today) });
    },
  },
];

export default {
  id: 'x',
  label: 'X / Twitter',
  labels: {
    subtitle: 'engine.x.subtitle',
    searchBtnLabel: 'engine.x.searchBtn',
    emptyPreview: 'engine.x.emptyPreview',
  },
  searchUrl: q => 'https://x.com/search?q=' + encodeURIComponent(q || '') + '&src=typed_query',
  keywordOperators,
  keywordOperatorOrder: [
    'none', 'from', 'to', 'mention', 'hashtag',
    'url', 'list', 'lang', 'near', 'source',
    'conversation_id', 'quoted_tweet_id',
  ],
  composerPills,
  drawer: {
    items: drawerItems,
    beginnerOrder: ['date-range', 'from', 'mention', 'hashtag', 'filter-media', 'engagement-faves', 'engagement-replies', 'engagement-retweets', 'lang'],
    beginnerMore: ['to', 'list', 'url', 'near', 'source', 'conversation_id', 'quoted_tweet_id'],
    advancedKeywords: ['from', 'to', 'mention', 'hashtag', 'list', 'url', 'lang', 'near', 'source', 'conversation_id', 'quoted_tweet_id'],
    advancedSpecials: [
      'date-range',
      'filter-media', 'filter-images', 'filter-videos',
      'filter-links', 'filter-replies', 'filter-quote',
      'filter-nativeretweets', 'filter-verified', 'filter-has_engagement',
      'engagement-faves', 'engagement-replies', 'engagement-retweets',
    ],
  },
  templates,
  idioms: IDIOMS,
  idiomGroupOrder: GROUP_ORDER,
  idiomGroupLabels: GROUP_LABELS,
  dateRangeOps: { after: 'since', before: 'until' },
  addableChipTypes: new Set(['keyword', 'or-connector', 'date-range', 'filter', 'engagement']),
  nonLatinForbiddenOps: new Set(['from', 'to', 'mention', 'list', 'url', 'lang', 'near', 'source', 'conversation_id', 'quoted_tweet_id']),
  // Twitter handles/IDs are single-token; the multi-word warn doesn't apply.
  // Plain `none` keywords still allow free multi-word text.
  multiWordOps: new Set(),
  parser: {
    keywordOperators: new Set(['from', 'to', 'url', 'list', 'lang', 'near', 'source', 'conversation_id', 'quoted_tweet_id']),
    prefixOperators: { '@': 'mention', '#': 'hashtag' },
  },
};
