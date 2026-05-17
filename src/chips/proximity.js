// Proximity chip — wraps Google's `"a" AROUND(N) "b"` operator. Three
// inputs: term1, distance, term2. Both terms are always quoted (Arabic
// terms with spaces require quoting for proximity to behave correctly).
// Distance defaults to 5; clamped to [1, 50].

import { t } from '../i18n/messages.js';

export const type = 'proximity';
export const label = 'engine.google.drawer.proximity.label';

export function defaultProps() {
  return { term1: '', distance: 5, term2: '' };
}

export function assemble(chip, ctx) {
  const t1 = (chip.props.term1 || '').trim();
  const t2 = (chip.props.term2 || '').trim();
  if (!t1 || !t2) return '';
  let n = parseInt(chip.props.distance, 10);
  if (isNaN(n) || n < 1) n = 5;
  if (n > 50) n = 50;
  const n1 = ctx.normalize(t1);
  const n2 = ctx.normalize(t2);
  return '"' + n1 + '" AROUND(' + n + ') "' + n2 + '"';
}

export function render(chip, handlers) {
  const el = document.createElement('span');
  el.className = 'chip chip-proximity chip-wide';
  el.dataset.chipId = chip.id;

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'chip-delete-btn';
  del.setAttribute('aria-label', t('chip.proximity.deleteAria'));
  del.textContent = '×';
  del.addEventListener('click', (e) => { e.stopPropagation(); handlers.onDelete(); });

  const opBadge = document.createElement('span');
  opBadge.className = 'chip-op-badge';
  opBadge.dir = 'ltr';
  opBadge.textContent = 'AROUND';

  const inputs = document.createElement('span');
  inputs.className = 'chip-wide-inputs';

  const t1 = document.createElement('input');
  t1.type = 'text';
  t1.className = 'chip-wide-input chip-wide-input-term';
  t1.dir = 'auto';
  t1.placeholder = t('chip.proximity.term1Placeholder');
  t1.value = chip.props.term1 || '';
  t1.setAttribute('aria-label', t('chip.proximity.term1Aria'));
  t1.addEventListener('input', () => {
    if (handlers.onChangeProps) handlers.onChangeProps({ term1: t1.value });
  });
  t1.addEventListener('click', (e) => e.stopPropagation());

  const distLabel = document.createElement('span');
  distLabel.className = 'chip-wide-input-label';
  distLabel.textContent = t('chip.proximity.distLabel');

  const dist = document.createElement('input');
  dist.type = 'number';
  dist.min = '1';
  dist.max = '50';
  dist.dir = 'ltr';
  dist.className = 'chip-wide-input chip-wide-input-distance';
  dist.value = String(chip.props.distance || 5);
  dist.setAttribute('aria-label', t('chip.proximity.distAria'));
  dist.addEventListener('input', () => {
    const n = parseInt(dist.value, 10);
    if (handlers.onChangeProps) handlers.onChangeProps({ distance: isNaN(n) ? 5 : n });
  });
  dist.addEventListener('click', (e) => e.stopPropagation());

  const distSuffix = document.createElement('span');
  distSuffix.className = 'chip-wide-input-label';
  distSuffix.textContent = t('chip.proximity.distSuffix');

  const t2 = document.createElement('input');
  t2.type = 'text';
  t2.className = 'chip-wide-input chip-wide-input-term';
  t2.dir = 'auto';
  t2.placeholder = t('chip.proximity.term2Placeholder');
  t2.value = chip.props.term2 || '';
  t2.setAttribute('aria-label', t('chip.proximity.term2Aria'));
  t2.addEventListener('input', () => {
    if (handlers.onChangeProps) handlers.onChangeProps({ term2: t2.value });
  });
  t2.addEventListener('click', (e) => e.stopPropagation());

  inputs.appendChild(t1);
  inputs.appendChild(distLabel);
  inputs.appendChild(dist);
  inputs.appendChild(distSuffix);
  inputs.appendChild(t2);

  el.appendChild(del);
  el.appendChild(opBadge);
  el.appendChild(inputs);
  return el;
}
