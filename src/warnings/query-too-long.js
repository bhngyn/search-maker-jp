import { t } from '../i18n/messages.js';

// Warns when the assembled query exceeds 32 words (Google's effective length limit).

/**
 * @param {import('../core/ctx.js').Ctx} ctx
 * @param {{ previewBox: HTMLElement }} [deps]
 * @returns {void | { onRender: () => void }}
 */
export function register(ctx, deps) {
  const previewBox = deps && deps.previewBox;
  function onRender() {
    const q = previewBox.textContent.trim();
    const wordCount = q && !previewBox.classList.contains('empty')
      ? q.split(/\s+/).filter(Boolean).length
      : 0;
    if (wordCount > 32) {
      ctx.addWarning('query-too-long', t('warning.queryTooLong', { count: wordCount }));
    } else {
      ctx.removeWarning('query-too-long');
    }
  }
  return { onRender };
}
