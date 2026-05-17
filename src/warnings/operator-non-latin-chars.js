// Warns when a Latin-only operator chip contains non-ASCII text (e.g.
// Japanese kana/kanji). On Google: site, inurl. On X: from, to, list,
// url, lang, etc. On Yahoo! Japan: site, inurl. The list of forbidden
// ops comes from the active engine descriptor; the wording is
// engine-agnostic.

import { getActiveEngine } from '../core/engine.js';
import { getOperatorsForActive } from '../chips/keyword.js';
import { t } from '../i18n/messages.js';

const NON_LATIN_RE = /[^\x00-\x7F]/;

/**
 * @param {import('../core/ctx.js').Ctx} ctx
 * @param {{ chipState: { getAll: () => any[] } }} [deps]
 */
export function register(ctx, deps) {
  const chipState = deps && deps.chipState;
  if (!chipState) return;

  function onRender() {
    const eng = getActiveEngine();
    const forbidden = eng.nonLatinForbiddenOps || new Set();
    const ops = getOperatorsForActive();
    const offending = chipState.getAll().filter(c =>
      c.type === 'keyword' &&
      forbidden.has(c.props.operator) &&
      NON_LATIN_RE.test(c.props.text || '')
    );
    if (offending.length) {
      const labels = [...new Set(offending.map(c => {
        const op = ops[c.props.operator];
        return op ? t(op.label) : c.props.operator;
      }))].join(', ');
      ctx.addWarning('operator-non-latin-chars', t('warning.operatorNonLatinChars', { labels }));
    } else {
      ctx.removeWarning('operator-non-latin-chars');
    }
  }
  return { onRender };
}
