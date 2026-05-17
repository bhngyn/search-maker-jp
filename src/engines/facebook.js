// Facebook search engine descriptor.
//
// String fields (subtitle, category labels/hints, section legends/options,
// id-field placeholders/hints, toggle labels) are i18n keys, NOT literal
// strings. Consumers resolve via `t(key)` from src/i18n/messages.js.
//
// Facebook search is fundamentally form-based, not query-string-based:
//   - The user picks a category (top, posts, people, photos, videos, pages).
//   - A required free-text keyword is sent as `q=`.
//   - Optional filters are encoded as a base64'd JSON blob in `filters=`.
//
// Each filter group is mutually exclusive (you can only pick one option from
// "Posts From", one from "Posted In Group", etc.), but groups can be combined
// across the URL. This is a different mental model from chip-based query
// builders, so the Facebook engine ships its own form UI rather than reusing
// the chip composer.
//
// Filter encoding: every filter value is itself a JSON string of
//   { name: "<filter_name>", args: "<filter_args>" }
// For the date filter, `args` is itself a JSON string. The outer object is
// then JSON-stringified, base64-encoded, and trailing `=` is stripped.
//
// Source: whopostedwhat.com filter reference. Operator definitions verbatim.

const CATEGORIES = [
  { value: 'top',    label: 'engine.facebook.cat.top.label',    hint: 'engine.facebook.cat.top.hint' },
  { value: 'posts',  label: 'engine.facebook.cat.posts.label',  hint: 'engine.facebook.cat.posts.hint' },
  { value: 'people', label: 'engine.facebook.cat.people.label', hint: 'engine.facebook.cat.people.hint' },
  { value: 'photos', label: 'engine.facebook.cat.photos.label', hint: 'engine.facebook.cat.photos.hint' },
  { value: 'videos', label: 'engine.facebook.cat.videos.label', hint: 'engine.facebook.cat.videos.hint' },
  { value: 'pages',  label: 'engine.facebook.cat.pages.label',  hint: 'engine.facebook.cat.pages.hint' },
];

// Each section is a mutually-exclusive group of options. Picking an option
// produces one entry in the outer JSON filter blob.
//
// Option shape:
//   { id, label, hint?, outerKey, name, args, idField? }
// where:
//   outerKey  — top-level key in the outer filter JSON (e.g. 'rp_author')
//   name      — value of the inner JSON's `name` field (e.g. 'author_me')
//   args      — value of the inner JSON's `args` field (literal '' for most)
//   idField   — when present, args is taken from a free-text input on the
//               option (e.g. page ID, group ID, location ID, user ID)

const POSTS_FROM = {
  id: 'postsFrom',
  legend: 'engine.facebook.sec.postsFrom.legend',
  options: [
    { id: 'none',           label: 'engine.facebook.sec.postsFrom.opt.none' },
    { id: 'author_me',      label: 'engine.facebook.sec.postsFrom.opt.author_me',      outerKey: 'rp_author', name: 'author_me' },
    { id: 'author_friends', label: 'engine.facebook.sec.postsFrom.opt.author_friends', outerKey: 'rp_author', name: 'author_friends_feed' },
    { id: 'author_groups',  label: 'engine.facebook.sec.postsFrom.opt.author_groups',  outerKey: 'rp_author', name: 'my_groups_and_pages_posts' },
    { id: 'author_public',  label: 'engine.facebook.sec.postsFrom.opt.author_public',  outerKey: 'rp_author', name: 'merged_public_posts' },
  ],
};

const POST_TYPE = {
  id: 'postType',
  legend: 'engine.facebook.sec.postType.legend',
  options: [
    { id: 'none',           label: 'engine.facebook.sec.postType.opt.none' },
    { id: 'interacted',     label: 'engine.facebook.sec.postType.opt.interacted', outerKey: 'interacted_posts', name: 'interacted_posts' },
  ],
};

const POSTED_IN_GROUP = {
  id: 'postedInGroup',
  legend: 'engine.facebook.sec.postedInGroup.legend',
  options: [
    { id: 'none',          label: 'engine.facebook.sec.postedInGroup.opt.none' },
    { id: 'my_groups',     label: 'engine.facebook.sec.postedInGroup.opt.my_groups', outerKey: 'rp_group', name: 'my_groups_posts' },
  ],
};

const SORT_BY = {
  id: 'sortBy',
  legend: 'engine.facebook.sec.sortBy.legend',
  options: [
    { id: 'none',   label: 'engine.facebook.sec.sortBy.opt.none' },
    { id: 'recent', label: 'engine.facebook.sec.sortBy.opt.recent', outerKey: 'rp_chrono_sort', name: 'chronosort' },
  ],
};

const PHOTO_TYPE = {
  id: 'photoType',
  legend: 'engine.facebook.sec.photoType.legend',
  options: [
    { id: 'none',       label: 'engine.facebook.sec.photoType.opt.none' },
    { id: 'interacted', label: 'engine.facebook.sec.photoType.opt.interacted', outerKey: 'interacted_photos', name: 'interacted_photos' },
  ],
};

const VIDEO_SOURCE = {
  id: 'videoSource',
  legend: 'engine.facebook.sec.videoSource.legend',
  options: [
    { id: 'none',     label: 'engine.facebook.sec.videoSource.opt.none' },
    { id: 'live',     label: 'engine.facebook.sec.videoSource.opt.live',    outerKey: 'videos_source', name: 'videos_live' },
    { id: 'episode',  label: 'engine.facebook.sec.videoSource.opt.episode', outerKey: 'videos_source', name: 'videos_episode' },
    { id: 'feed',     label: 'engine.facebook.sec.videoSource.opt.feed',    outerKey: 'videos_source', name: 'videos_feed' },
  ],
};

// People-search filter sections. ID-driven sections (City/Education/Work) and
// the ID-bearing "Friends of <user>" option are intentionally omitted: they
// require opaque numeric IDs that the form can't help users discover.
const PEOPLE_MUTUAL = {
  id: 'peopleMutual',
  legend: 'engine.facebook.sec.peopleMutual.legend',
  options: [
    { id: 'none',               label: 'engine.facebook.sec.peopleMutual.opt.none' },
    { id: 'my_friends',         label: 'engine.facebook.sec.peopleMutual.opt.my_friends',         outerKey: 'friends', name: 'users_friends' },
    { id: 'friends_of_friends', label: 'engine.facebook.sec.peopleMutual.opt.friends_of_friends', outerKey: 'friends', name: 'users_friends_of_friends' },
  ],
};

// Pages-search filter sections.
const PAGES_VERIFIED = {
  id: 'pagesVerified',
  legend: 'engine.facebook.sec.pagesVerified.legend',
  kind: 'toggle',
  outerKey: 'verified',
  name: 'pages_verified',
  toggleLabel: 'engine.facebook.sec.pagesVerified.toggleLabel',
};

const PAGES_CATEGORY = {
  id: 'pagesCategory',
  legend: 'engine.facebook.sec.pagesCategory.legend',
  options: [
    { id: 'none',       label: 'engine.facebook.sec.pagesCategory.opt.none' },
    { id: 'local',      label: 'engine.facebook.sec.pagesCategory.opt.local',     outerKey: 'category', name: 'pages_category', argsValue: '1006' },
    { id: 'company',    label: 'engine.facebook.sec.pagesCategory.opt.company',   outerKey: 'category', name: 'pages_category', argsValue: '1013' },
    { id: 'brand',      label: 'engine.facebook.sec.pagesCategory.opt.brand',     outerKey: 'category', name: 'pages_category', argsValue: '1009' },
    { id: 'artist',     label: 'engine.facebook.sec.pagesCategory.opt.artist',    outerKey: 'category', name: 'pages_category', argsValue: '1007,180164648685982' },
    { id: 'entertain',  label: 'engine.facebook.sec.pagesCategory.opt.entertain', outerKey: 'category', name: 'pages_category', argsValue: '1019' },
    { id: 'cause',      label: 'engine.facebook.sec.pagesCategory.opt.cause',     outerKey: 'category', name: 'pages_category', argsValue: '2612' },
  ],
};

// Date-Posted is shared. It's a special section (not a radio group) — a
// year picker with an optional "advanced" range mode (start_day/end_day).
const DATE_POSTED = {
  id: 'datePosted',
  legend: 'engine.facebook.sec.datePosted.legend',
  kind: 'date',
  outerKey: 'rp_creation_time',
  name: 'creation_time',
};

// Per-category section composition. The form renders sections in this order
// when the matching category is selected.
const CATEGORY_SECTIONS = {
  top:    [SORT_BY, POSTS_FROM, POST_TYPE, POSTED_IN_GROUP, DATE_POSTED],
  posts:  [POSTS_FROM, POST_TYPE, POSTED_IN_GROUP, DATE_POSTED],
  people: [PEOPLE_MUTUAL],
  photos: [POSTS_FROM, PHOTO_TYPE, DATE_POSTED],
  videos: [VIDEO_SOURCE, DATE_POSTED],
  pages:  [PAGES_VERIFIED, PAGES_CATEGORY],
};

/**
 * Build a Facebook search URL from a form-state snapshot.
 *
 * State shape (managed by ui/facebook-form.js):
 *   {
 *     category: 'top' | 'posts' | 'people' | 'photos' | 'videos' | 'pages',
 *     keyword:  string,
 *     // For radio sections: { sectionId: { optionId, idValue? } }
 *     sections: { [sectionId]: { optionId: string, idValue?: string } },
 *     // For toggle sections (pagesVerified): { sectionId: boolean }
 *     toggles:  { [sectionId]: boolean },
 *     // For idOnly sections (peopleCity etc.): { sectionId: string }
 *     ids:      { [sectionId]: string },
 *     // Date section state: { startYear, startMonth, startDay, endYear, endMonth, endDay } or null
 *     date:     null | { ... },
 *   }
 */
function buildFacebookUrl(state) {
  const category = state.category || 'top';
  const keyword  = (state.keyword || '').trim();
  // Facebook requires q=… even when empty; whopostedwhat sends "people" as
  // a placeholder. We send the literal user keyword, leaving empty if blank.
  const filterPairs = collectFilterPairs(state);
  const filtersStr = encodeFilters(filterPairs);
  const qParam = 'q=' + encodeURIComponent(keyword);
  const filtersParam = filtersStr ? '&epa=FILTERS&filters=' + filtersStr : '';
  return `https://www.facebook.com/search/${category}/?${qParam}${filtersParam}`;
}

function collectFilterPairs(state) {
  const pairs = []; // [outerKey, innerJsonString]
  const sections = CATEGORY_SECTIONS[state.category] || [];
  for (const section of sections) {
    if (section.kind === 'date') {
      const inner = encodeDateFilter(state.date);
      if (inner) pairs.push([section.outerKey, JSON.stringify({ name: section.name, args: inner })]);
      continue;
    }
    if (section.kind === 'toggle') {
      if (state.toggles && state.toggles[section.id]) {
        pairs.push([section.outerKey, JSON.stringify({ name: section.name, args: '' })]);
      }
      continue;
    }
    if (section.kind === 'idOnly') {
      const v = (state.ids && state.ids[section.id]) || '';
      if (v.trim()) pairs.push([section.outerKey, JSON.stringify({ name: section.name, args: v.trim() })]);
      continue;
    }
    // Radio section.
    const sel = state.sections && state.sections[section.id];
    if (!sel || !sel.optionId || sel.optionId === 'none') continue;
    const opt = section.options.find(o => o.id === sel.optionId);
    if (!opt || !opt.outerKey) continue;
    let args = '';
    if (typeof opt.argsValue === 'string') args = opt.argsValue;
    else if (opt.idField) args = (sel.idValue || '').trim();
    pairs.push([opt.outerKey, JSON.stringify({ name: opt.name, args })]);
  }
  return pairs;
}

function encodeDateFilter(date) {
  if (!date) return '';
  const ds = date.startDay, de = date.endDay;
  if (!ds && !de) {
    // Year-only fallback: if startYear+endYear set, fill out months/days
    if (!date.startYear && !date.endYear) return '';
  }
  // Build the inner-inner object. Facebook expects month strings like
  // "2019-1" (not zero-padded) and day strings like "2019-1-1".
  const out = {};
  if (date.startYear)  out.start_year  = String(date.startYear);
  if (date.startMonth) out.start_month = date.startMonth;
  if (date.endYear)    out.end_year    = String(date.endYear);
  if (date.endMonth)   out.end_month   = date.endMonth;
  if (date.startDay)   out.start_day   = date.startDay;
  if (date.endDay)     out.end_day     = date.endDay;
  if (Object.keys(out).length === 0) return '';
  return JSON.stringify(out);
}

function encodeFilters(pairs) {
  if (!pairs.length) return '';
  const obj = {};
  for (const [k, v] of pairs) obj[k] = v;
  const json = JSON.stringify(obj);
  // UTF-8 safe base64 — btoa() is Latin-1 only.
  let b64;
  try {
    b64 = btoa(unescape(encodeURIComponent(json)));
  } catch (e) {
    b64 = btoa(json);
  }
  // Strip trailing `=` per whopostedwhat — Facebook accepts this form.
  return b64.replace(/=+$/, '');
}

export default {
  id: 'facebook',
  label: 'Facebook',
  formBased: true,
  labels: {
    subtitle: 'engine.facebook.subtitle',
    searchBtnLabel: 'engine.facebook.searchBtn',
    emptyPreview: 'engine.facebook.emptyPreview',
  },
  // Identity passthrough — the form already produces the full URL, so the
  // preview's `q` is the URL. The search button opens `q` as-is.
  searchUrl: q => q,
  categories: CATEGORIES,
  categorySections: CATEGORY_SECTIONS,
  buildUrl: buildFacebookUrl,
  // Stub fields for the chip system. These are never read while Facebook is
  // active because main.js hides the chip surface, but the engine controller
  // / chip modules import from this descriptor at boot, so the keys must
  // exist with safe defaults.
  keywordOperators: { none: { label: 'engine.google.op.none.label', opName: '', dir: 'auto', normalizes: false, quotable: false, acceptsArabic: true } },
  keywordOperatorOrder: ['none'],
  composerPills: [{ op: 'none', label: 'engine.google.op.none.label' }],
  drawer: { items: {}, beginnerOrder: [], beginnerMore: [], advancedKeywords: [], advancedSpecials: [] },
  templates: [],
  dateRangeOps: { after: 'after', before: 'before' },
  addableChipTypes: new Set(['keyword']),
  nonLatinForbiddenOps: new Set(),
  multiWordOps: new Set(),
  parser: { keywordOperators: new Set(), prefixOperators: {} },
};
