import { renderWarningGlyph } from '../ui/chip-popover.js';
import { t } from '../i18n/messages.js';

// Filter chip — wraps Twitter's `filter:<flag>` family in a single
// dropdown chip with a built-in negate toggle.
//
// Most filter values support negation via `-filter:<flag>`. Two exceptions:
//   - `filter:follows` is non-negatable per CLAUDE-X.md (cannot be flipped
//     in the UI; the negate toggle is hidden when this value is selected).
//   - `nativeretweets` flips between `filter:nativeretweets` (only
//     retweets) and `include:nativeretweets` (retweets in addition to
//     other tweets) per twitter_operators.md lines 52-53. The negate
//     toggle on this value emits the include: form rather than -filter:.

export const type = 'filter';
export const label = 'engine.x.drawer.filter.label';

export const FILTERS = [
  { value: '',               labelKey: 'chip.filter.opt.none',          negatable: false },
  { value: 'media',          labelKey: 'chip.filter.opt.media',          negatable: true },
  { value: 'images',         labelKey: 'chip.filter.opt.images',         negatable: true },
  { value: 'videos',         labelKey: 'chip.filter.opt.videos',         negatable: true },
  { value: 'native_video',   labelKey: 'chip.filter.opt.native_video',   negatable: true },
  { value: 'spaces',         labelKey: 'chip.filter.opt.spaces',         negatable: true },
  { value: 'links',          labelKey: 'chip.filter.opt.links',          negatable: true },
  { value: 'mentions',       labelKey: 'chip.filter.opt.mentions',       negatable: true },
  { value: 'hashtags',       labelKey: 'chip.filter.opt.hashtags',       negatable: true },
  { value: 'replies',        labelKey: 'chip.filter.opt.replies',        negatable: true },
  { value: 'quote',          labelKey: 'chip.filter.opt.quote',          negatable: true },
  { value: 'nativeretweets', labelKey: 'chip.filter.opt.nativeretweets', negatable: true, includeForm: true },
  { value: 'retweets',       labelKey: 'chip.filter.opt.retweets',       negatable: true },
  { value: 'verified',       labelKey: 'chip.filter.opt.verified',       negatable: true },
  { value: 'blue_verified',  labelKey: 'chip.filter.opt.blue_verified',  negatable: true },
  { value: 'follows',        labelKey: 'chip.filter.opt.follows',        negatable: false },
  { value: 'has_engagement', labelKey: 'chip.filter.opt.has_engagement', negatable: true },
];

function findFilter(value) {
  return FILTERS.find(f => f.value === value);
}

export function defaultProps() {
  return { value: 'media', negate: false };
}

export function assemble(chip) {
  const v = (chip.props.value || '').trim();
  if (!v) return '';
  const f = findFilter(v);
  if (!f) return '';
  // Non-negatable filter forced negative — defensive: emit positive form.
  if (chip.props.negate && !f.negatable) return 'filter:' + v;
  // nativeretweets uses include: rather than -filter: when negated.
  if (chip.props.negate && f.includeForm) return 'include:' + v;
  if (chip.props.negate) return '-filter:' + v;
  return 'filter:' + v;
}

/**
 * @param {{ props: { value: string, negate: boolean } }} chip
 */
export function validate(chip) {
  const issues = [];
  const f = findFilter(chip.props.value);
  if (chip.props.negate && f && !f.negatable) {
    issues.push({
      severity: 'warning',
      message: t('chip.filter.validate.notNegatable'),
      fix: { label: t('chip.filter.validate.notNegatableFix'), apply: () => ({ negate: false }) },
    });
  }
  return issues;
}

export function render(chip, handlers) {
  const el = document.createElement('span');
  el.className = 'chip chip-filter chip-wide';
  if (chip.props.negate) el.classList.add('chip-negate');
  el.dataset.chipId = chip.id;

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'chip-delete-btn';
  del.setAttribute('aria-label', t('chip.filter.deleteAria'));
  del.textContent = '×';
  del.addEventListener('click', (e) => { e.stopPropagation(); handlers.onDelete(); });

  const opBadge = document.createElement('span');
  opBadge.className = 'chip-op-badge';
  opBadge.dir = 'ltr';
  opBadge.textContent = 'filter:';

  const select = document.createElement('select');
  select.className = 'chip-wide-select';
  select.setAttribute('aria-label', t('chip.filter.selectAria'));
  FILTERS.forEach(({ value, labelKey }) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = t(labelKey);
    if (value === chip.props.value) opt.selected = true;
    select.appendChild(opt);
  });
  select.addEventListener('change', (e) => {
    if (handlers.onChangeProps) handlers.onChangeProps({ value: e.target.value });
  });
  select.addEventListener('click', (e) => e.stopPropagation());

  // NOT toggle — hidden when the selected filter cannot be negated.
  const f = findFilter(chip.props.value);
  let negBtn = null;
  if (f && f.negatable) {
    negBtn = document.createElement('button');
    negBtn.type = 'button';
    negBtn.className = 'chip-tool-btn';
    negBtn.setAttribute('aria-pressed', chip.props.negate ? 'true' : 'false');
    negBtn.setAttribute('aria-label', chip.props.negate ? t('chip.filter.notOn') : t('chip.filter.notOff'));
    negBtn.title = chip.props.negate ? t('chip.filter.notOn') : t('chip.filter.notOff');
    negBtn.textContent = '−';
    negBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (handlers.onChangeProps) handlers.onChangeProps({ negate: !chip.props.negate });
    });
  }

  const glyph = renderWarningGlyph(chip, validate(chip), handlers);

  el.appendChild(del);
  el.appendChild(opBadge);
  if (glyph) el.appendChild(glyph);
  el.appendChild(select);
  if (negBtn) el.appendChild(negBtn);
  return el;
}
