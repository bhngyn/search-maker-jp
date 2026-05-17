import { t } from '../i18n/messages.js';

// Tip surfaced when the user has only plain keyword chips and no operator
// or special chips — broad keyword searches return too many results to
// review effectively.

/**
 * @param {import('../core/ctx.js').Ctx} ctx
 * @param {{ chipState: { getAll: () => any[] } }} [deps]
 */
export function register(ctx, deps) {
  const chipState = deps && deps.chipState;
  if (!chipState) return;

  function onRender() {
    const chips = chipState.getAll().filter(c => c.type !== 'or-connector');
    if (chips.length === 0) {
      ctx.removeTip('keywords-no-restrictions');
      return;
    }
    const allPlain = chips.every(c =>
      c.type === 'keyword' && (!c.props.operator || c.props.operator === 'none')
    );
    if (allPlain && chips.length >= 1) {
      ctx.addTip('keywords-no-restrictions', {
        priority: 20,
        messageHtml: t('tip.keywordsNoRestrictions'),
      });
    } else {
      ctx.removeTip('keywords-no-restrictions');
    }
  }
  return { onRender };
}
