import { t } from '../i18n/messages.js';

// Tip surfaced when the user has a filled proximity chip — points out
// the OSINT use case (finding two entities mentioned together) and gives
// distance-tuning guidance.

/**
 * @param {import('../core/ctx.js').Ctx} ctx
 * @param {{ chipState: { getAll: () => any[] } }} [deps]
 */
export function register(ctx, deps) {
  const chipState = deps && deps.chipState;
  if (!chipState) return;

  function onRender() {
    const trigger = chipState.getAll().some(c =>
      c.type === 'proximity' &&
      (c.props.term1 || '').trim() &&
      (c.props.term2 || '').trim()
    );
    if (trigger) {
      ctx.addTip('proximity-usage', {
        priority: 60,
        messageHtml: t('tip.proximityUsage'),
      });
    } else {
      ctx.removeTip('proximity-usage');
    }
  }
  return { onRender };
}
