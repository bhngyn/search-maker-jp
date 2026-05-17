import { t } from '../i18n/messages.js';

// "PDF + suggest site restriction" tip — fires when a filetype chip is set
// to PDF (the most common Google operator combination for finding leaked
// or official documents).

/**
 * @param {import('../core/ctx.js').Ctx} ctx
 * @param {{ chipState: { getAll: () => any[] } }} [deps]
 */
export function register(ctx, deps) {
  const chipState = deps && deps.chipState;
  if (!chipState) return;

  function onRender() {
    const hasPdf = chipState.getAll().some(c => c.type === 'filetype' && c.props.value === 'pdf');
    if (hasPdf) {
      ctx.addTip('filetype-pdf', {
        priority: 70,
        messageHtml: t('tip.filetypePdf'),
      });
    } else {
      ctx.removeTip('filetype-pdf');
    }
  }
  return { onRender };
}
