// Engagement chip — Twitter's `min_faves:`, `min_replies:`, `min_retweets:`
// family. Direction toggle picks between minimum (e.g. `min_faves:100`)
// and maximum (e.g. `-min_faves:100`, which Twitter parses as a strict
// upper bound — see twitter_operators.md lines 67-69).

import { renderWarningGlyph } from '../ui/chip-popover.js';
import { t } from '../i18n/messages.js';

export const type = 'engagement';
export const label = 'engine.x.drawer.engagement.label';

export const METRICS = [
  { value: 'min_faves',    labelKey: 'chip.engagement.metric.faves' },
  { value: 'min_replies',  labelKey: 'chip.engagement.metric.replies' },
  { value: 'min_retweets', labelKey: 'chip.engagement.metric.retweets' },
];

export function defaultProps() {
  return { metric: 'min_faves', direction: 'min', value: 100 };
}

export function assemble(chip) {
  const n = parseInt(chip.props.value, 10);
  if (isNaN(n) || n < 0) return '';
  const op = chip.props.metric || 'min_faves';
  const prefix = chip.props.direction === 'max' ? '-' : '';
  return prefix + op + ':' + n;
}

/**
 * @param {{ props: { value: any } }} chip
 */
export function validate(chip) {
  const issues = [];
  const raw = chip.props.value;
  // An empty value is "in-progress" and shouldn't surface as a warning.
  if (raw === '' || raw == null) return issues;
  const n = parseInt(raw, 10);
  if (isNaN(n) || n < 0 || String(n) !== String(raw).trim()) {
    issues.push({
      severity: 'warning',
      message: t('chip.engagement.validate.invalid'),
      fix: { label: t('chip.engagement.validate.invalidFix'), apply: () => ({ value: 100 }) },
    });
  }
  return issues;
}

export function render(chip, handlers) {
  const el = document.createElement('span');
  el.className = 'chip chip-engagement chip-wide';
  el.dataset.chipId = chip.id;

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'chip-delete-btn';
  del.setAttribute('aria-label', t('chip.engagement.deleteAria'));
  del.textContent = '×';
  del.addEventListener('click', (e) => { e.stopPropagation(); handlers.onDelete(); });

  const opBadge = document.createElement('span');
  opBadge.className = 'chip-op-badge';
  opBadge.dir = 'ltr';
  opBadge.textContent = 'min:';

  const inputs = document.createElement('span');
  inputs.className = 'chip-wide-inputs';

  // Metric select.
  const metricSelect = document.createElement('select');
  metricSelect.className = 'chip-wide-select';
  metricSelect.setAttribute('aria-label', t('chip.engagement.metricAria'));
  METRICS.forEach(({ value, labelKey }) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = t(labelKey);
    if (value === chip.props.metric) opt.selected = true;
    metricSelect.appendChild(opt);
  });
  metricSelect.addEventListener('change', (e) => {
    if (handlers.onChangeProps) handlers.onChangeProps({ metric: e.target.value });
  });
  metricSelect.addEventListener('click', (e) => e.stopPropagation());

  // Direction toggle — single button that flips between min/max.
  const isMax = chip.props.direction === 'max';
  const dirBtn = document.createElement('button');
  dirBtn.type = 'button';
  dirBtn.className = 'chip-tool-btn chip-engagement-dir';
  if (isMax) dirBtn.classList.add('is-max');
  dirBtn.setAttribute('aria-pressed', isMax ? 'true' : 'false');
  dirBtn.setAttribute('aria-label', isMax ? t('chip.engagement.dirMaxAria') : t('chip.engagement.dirMinAria'));
  dirBtn.textContent = isMax ? t('chip.engagement.dirMax') : t('chip.engagement.dirMin');
  dirBtn.title = isMax ? t('chip.engagement.dirMaxAria') : t('chip.engagement.dirMinAria');
  dirBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (handlers.onChangeProps) {
      handlers.onChangeProps({ direction: isMax ? 'min' : 'max' });
    }
  });

  // Numeric input.
  const numInput = document.createElement('input');
  numInput.type = 'number';
  numInput.min = '0';
  numInput.className = 'chip-wide-input';
  numInput.dir = 'ltr';
  numInput.setAttribute('aria-label', t('chip.engagement.numAria'));
  numInput.value = chip.props.value != null ? String(chip.props.value) : '';
  numInput.addEventListener('input', () => {
    if (handlers.onChangeProps) handlers.onChangeProps({ value: numInput.value });
  });
  numInput.addEventListener('click', (e) => e.stopPropagation());

  inputs.appendChild(metricSelect);
  inputs.appendChild(dirBtn);
  inputs.appendChild(numInput);

  const glyph = renderWarningGlyph(chip, validate(chip), handlers);

  el.appendChild(del);
  el.appendChild(opBadge);
  if (glyph) el.appendChild(glyph);
  el.appendChild(inputs);
  return el;
}
