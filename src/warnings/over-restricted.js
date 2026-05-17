import { t } from '../i18n/messages.js';

// Warns when too many operator-bearing chips are active simultaneously.
// Highly restricted queries often return zero results.

/**
 * @param {import('../core/ctx.js').Ctx} ctx
 * @param {{ chipState: { getAll: () => any[] } }} [deps]
 */
export function register(ctx, deps) {
  const chipState = deps && deps.chipState;
  if (!chipState) return;

  function isRestricting(chip) {
    if (chip.type === 'or-connector') return false;
    if (chip.type === 'keyword') {
      // Only operator-bound keyword chips count as restrictions.
      return chip.props.operator && chip.props.operator !== 'none' && (chip.props.text || '').trim().length > 0;
    }
    // Wide chips (filetype, date-range, proximity, number-range) all count
    // as restrictions whenever they have content.
    if (chip.type === 'filetype') return !!chip.props.value;
    if (chip.type === 'date-range') return !!(chip.props.after || chip.props.before);
    if (chip.type === 'proximity') return !!(chip.props.term1 && chip.props.term2);
    if (chip.type === 'number-range') return !!(chip.props.low && chip.props.high);
    return false;
  }

  function onRender() {
    const count = chipState.getAll().filter(isRestricting).length;
    if (count > 4) {
      ctx.addWarning('over-restricted', t('warning.overRestricted', { count }));
    } else {
      ctx.removeWarning('over-restricted');
    }
  }
  return { onRender };
}
