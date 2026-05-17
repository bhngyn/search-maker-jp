// Boolean connector chip — sits between two term chips and represents
// either OR (default) or AND. Click the chip to toggle.
//
//   kind = 'or'  → contributes to an OR group; the chip-state walker joins
//                  adjacent terms with " OR " inside parens.
//   kind = 'and' → no grouping; the connector renders inline as a visible
//                  AND chip and the assembler emits nothing (Google's
//                  implicit AND between adjacent tokens already handles it).
//
// The type stays `or-connector` for backwards compatibility with chip-state's
// cleanupConnectors() and parse-query.js. The `kind` prop discriminates the
// two modes.

import { t } from '../i18n/messages.js';

export const type = 'or-connector';

export const label = 'ui.orConnector.label';

export function defaultProps() {
  return { kind: 'or' };
}

/**
 * Connectors never emit query text by themselves — chip-state walks runs of
 * [term, OR, term, OR, term] and outputs "(a OR b OR c)" itself. AND-kind
 * connectors break OR runs but emit nothing (the implicit space between two
 * rendered chunks already represents AND for Google).
 */
export function assemble() {
  return '';
}

/**
 * @param {{ id: string, type: string, props: { kind?: 'or' | 'and' } }} chip
 * @param {{ onDelete: () => void, onChangeProps?: (patch: object) => void }} handlers
 */
export function render(chip, handlers) {
  const kind = chip.props && chip.props.kind === 'and' ? 'and' : 'or';
  const el = document.createElement('span');
  el.className = 'chip chip-or-connector chip-bool-connector chip-bool-' + kind;
  el.dataset.chipId = chip.id;
  el.setAttribute('role', 'group');
  el.setAttribute('aria-label', kind === 'and' ? t('ui.andConnector.ariaLabel') : t('ui.orConnector.ariaLabel'));
  el.title = t('ui.boolConnector.toggleHint');

  const text = document.createElement('button');
  text.type = 'button';
  text.className = 'chip-or-text chip-bool-toggle';
  text.textContent = kind === 'and' ? t('ui.andConnector.label') : t('ui.orConnector.label');
  text.setAttribute('aria-pressed', kind === 'or' ? 'true' : 'false');
  text.setAttribute('aria-label', t('ui.boolConnector.toggleHint'));
  text.addEventListener('click', (e) => {
    e.stopPropagation();
    if (handlers.onChangeProps) {
      handlers.onChangeProps({ kind: kind === 'or' ? 'and' : 'or' });
    }
  });
  el.appendChild(text);

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'chip-delete-btn chip-delete-btn-small';
  del.setAttribute('aria-label', kind === 'and' ? t('ui.andConnector.deleteAria') : t('ui.orConnector.deleteAria'));
  del.textContent = '×';
  del.addEventListener('click', (e) => {
    e.stopPropagation();
    handlers.onDelete();
  });
  el.appendChild(del);

  return el;
}
