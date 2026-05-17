// Number-range chip — wraps Google's `LOW..HIGH` operator with an optional
// unit prefix (e.g. `$50..$100`). Three inputs: low, high, prefix.

import { t } from '../i18n/messages.js';

export const type = 'number-range';
export const label = 'engine.google.drawer.numberRange.label';

export function defaultProps() {
  return { low: '', high: '', prefix: '' };
}

export function assemble(chip) {
  const low = String(chip.props.low || '').trim();
  const high = String(chip.props.high || '').trim();
  if (!low || !high) return '';
  const prefix = String(chip.props.prefix || '').trim();
  return prefix ? prefix + low + '..' + prefix + high : low + '..' + high;
}

export function render(chip, handlers) {
  const el = document.createElement('span');
  el.className = 'chip chip-number-range chip-wide';
  el.dataset.chipId = chip.id;

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'chip-delete-btn';
  del.setAttribute('aria-label', t('chip.numberRange.deleteAria'));
  del.textContent = '×';
  del.addEventListener('click', (e) => { e.stopPropagation(); handlers.onDelete(); });

  const opBadge = document.createElement('span');
  opBadge.className = 'chip-op-badge';
  opBadge.dir = 'ltr';
  opBadge.textContent = 'A..B';

  const inputs = document.createElement('span');
  inputs.className = 'chip-wide-inputs';
  inputs.dir = 'ltr';

  const lowInput = document.createElement('input');
  lowInput.type = 'number';
  lowInput.className = 'chip-wide-input chip-wide-input-num';
  lowInput.placeholder = t('chip.numberRange.lowPlaceholder');
  lowInput.value = chip.props.low ?? '';
  lowInput.setAttribute('aria-label', t('chip.numberRange.lowAria'));
  lowInput.addEventListener('input', () => {
    if (handlers.onChangeProps) handlers.onChangeProps({ low: lowInput.value });
  });
  lowInput.addEventListener('click', (e) => e.stopPropagation());

  const sep = document.createElement('span');
  sep.className = 'chip-wide-input-label';
  sep.textContent = '..';

  const highInput = document.createElement('input');
  highInput.type = 'number';
  highInput.className = 'chip-wide-input chip-wide-input-num';
  highInput.placeholder = t('chip.numberRange.highPlaceholder');
  highInput.value = chip.props.high ?? '';
  highInput.setAttribute('aria-label', t('chip.numberRange.highAria'));
  highInput.addEventListener('input', () => {
    if (handlers.onChangeProps) handlers.onChangeProps({ high: highInput.value });
  });
  highInput.addEventListener('click', (e) => e.stopPropagation());

  const prefixInput = document.createElement('input');
  prefixInput.type = 'text';
  prefixInput.className = 'chip-wide-input chip-wide-input-prefix';
  prefixInput.placeholder = '$';
  prefixInput.maxLength = 3;
  prefixInput.value = chip.props.prefix || '';
  prefixInput.setAttribute('aria-label', t('chip.numberRange.prefixAria'));
  prefixInput.addEventListener('input', () => {
    if (handlers.onChangeProps) handlers.onChangeProps({ prefix: prefixInput.value });
  });
  prefixInput.addEventListener('click', (e) => e.stopPropagation());

  inputs.appendChild(lowInput);
  inputs.appendChild(sep);
  inputs.appendChild(highInput);
  inputs.appendChild(prefixInput);

  el.appendChild(del);
  el.appendChild(opBadge);
  el.appendChild(inputs);
  return el;
}
