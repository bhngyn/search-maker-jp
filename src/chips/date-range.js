import { renderWarningGlyph } from '../ui/chip-popover.js';
import { getActiveEngine } from '../core/engine.js';
import { getActiveLang } from '../core/lang.js';
import { createArabicDateInput } from '../ui/arabic-calendar.js';
import { t } from '../i18n/messages.js';

// Date-range chip — wraps the active engine's date-bound operators in a
// single chip with two date inputs. Google emits `after:` / `before:`; X /
// Twitter emits `since:` / `until:`. Either or both may be empty; only the
// non-empty operators are emitted. The chip's stored prop names stay
// `after` / `before` regardless of engine — only the assembled string
// changes — so chips survive engine switches.

export const type = 'date-range';
export const label = 'engine.google.drawer.dateRange.label';

export function defaultProps() {
  return { after: '', before: '' };
}

export function assemble(chip) {
  const after = (chip.props.after || '').trim();
  const before = (chip.props.before || '').trim();
  const ops = getActiveEngine().dateRangeOps || { after: 'after', before: 'before' };
  const parts = [];
  if (after) parts.push(ops.after + ':' + after);
  if (before) parts.push(ops.before + ':' + before);
  return parts.join(' ');
}

/**
 * @param {{ props: { after: string, before: string } }} chip
 */
export function validate(chip) {
  const issues = [];
  const after = chip.props.after;
  const before = chip.props.before;
  if (after && before && after > before) {
    issues.push({
      severity: 'warning',
      message: t('chip.dateRange.validate.inverted'),
      fix: { label: t('chip.dateRange.validate.invertedFix'), apply: () => ({ after: before, before: after }) },
    });
  }
  return issues;
}

export function render(chip, handlers) {
  const el = document.createElement('span');
  el.className = 'chip chip-date-range chip-wide';
  el.dataset.chipId = chip.id;

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'chip-delete-btn';
  del.setAttribute('aria-label', t('chip.dateRange.deleteAria'));
  del.textContent = '×';
  del.addEventListener('click', (e) => { e.stopPropagation(); handlers.onDelete(); });

  const opBadge = document.createElement('span');
  opBadge.className = 'chip-op-badge';
  opBadge.dir = 'ltr';
  opBadge.textContent = '📅';

  // Inputs: after / before. Native date pickers so users get the OS picker.
  const inputs = document.createElement('span');
  inputs.className = 'chip-wide-inputs';
  inputs.dir = 'ltr';

  const afterLabel = document.createElement('span');
  afterLabel.className = 'chip-wide-input-label';
  afterLabel.textContent = t('chip.dateRange.afterLabel');

  const beforeLabel = document.createElement('span');
  beforeLabel.className = 'chip-wide-input-label';
  beforeLabel.textContent = t('chip.dateRange.beforeLabel');

  // JP fork: always use the native HTML5 <input type="date"> picker. The
  // Arabic Hijri-aware calendar widget is dead code in this fork.
  let afterEl, beforeEl;
  if (false) {
    afterEl  = createArabicDateInput({ value: chip.props.after  || '', ariaLabel: '', onChange: () => {} }).el;
    beforeEl = createArabicDateInput({ value: chip.props.before || '', ariaLabel: '', onChange: () => {} }).el;
  } else {
    const afterInput = document.createElement('input');
    afterInput.type = 'date';
    afterInput.className = 'chip-wide-input chip-wide-input-date';
    afterInput.setAttribute('aria-label', t('chip.dateRange.afterAria'));
    afterInput.value = chip.props.after || '';
    afterInput.addEventListener('input', () => {
      if (handlers.onChangeProps) handlers.onChangeProps({ after: afterInput.value });
    });
    afterInput.addEventListener('click', (e) => e.stopPropagation());

    const beforeInput = document.createElement('input');
    beforeInput.type = 'date';
    beforeInput.className = 'chip-wide-input chip-wide-input-date';
    beforeInput.setAttribute('aria-label', t('chip.dateRange.beforeAria'));
    beforeInput.value = chip.props.before || '';
    beforeInput.addEventListener('input', () => {
      if (handlers.onChangeProps) handlers.onChangeProps({ before: beforeInput.value });
    });
    beforeInput.addEventListener('click', (e) => e.stopPropagation());

    afterEl = afterInput;
    beforeEl = beforeInput;
  }

  inputs.appendChild(afterLabel);
  inputs.appendChild(afterEl);
  inputs.appendChild(beforeLabel);
  inputs.appendChild(beforeEl);

  const glyph = renderWarningGlyph(chip, validate(chip), handlers);

  el.appendChild(del);
  el.appendChild(opBadge);
  if (glyph) el.appendChild(glyph);
  el.appendChild(inputs);
  return el;
}
