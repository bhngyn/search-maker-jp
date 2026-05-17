// Bulk-actions toolbar for multi-select.
//
// Subscribes to a selection observable + chip state. When selection is
// non-empty, renders a toolbar with bulk actions:
//   - "غيّر العامل" dropdown (only if all selected chips are keyword chips)
//   - "نفي" / "إلغاء النفي" toggle (only if all selected can be negated)
//   - "حذف" — delete all selected
//   - "إلغاء التحديد" — clear selection

import { getOperatorsForActive, getOperatorKeysForActive } from '../chips/keyword.js';
import { t } from '../i18n/messages.js';

/**
 * @param {object} args
 * @param {HTMLElement} args.host
 * @param {{ getAll: () => any[], update: Function, remove: Function }} args.chipState
 * @param {{ get: () => Set<string>, subscribe: (cb: () => void) => void, clear: () => void }} args.selection
 */
export function wireChipToolbar({ host, chipState, selection, lang }) {
  host.classList.add('chip-toolbar');
  host.setAttribute('role', 'toolbar');
  host.setAttribute('aria-label', t('ui.toolbar.ariaLabel'));

  function selectedChips() {
    const ids = selection.get();
    if (ids.size === 0) return [];
    const all = chipState.getAll();
    const order = new Map();
    all.forEach((c, i) => order.set(c.id, i));
    return Array.from(ids)
      .filter(id => order.has(id))
      .map(id => all[order.get(id)]);
  }

  function render() {
    const sel = selectedChips();
    const showing = sel.length > 0;
    if (!showing) {
      host.hidden = true;
      host.innerHTML = '';
      return;
    }
    host.hidden = false;

    const allKeyword = sel.every(c => c.type === 'keyword');
    const negatableTypes = new Set(['keyword']);
    const allNegatable = sel.every(c => negatableTypes.has(c.type));
    const allNegated = allNegatable && sel.every(c => c.props.negate === true);

    host.innerHTML = '';

    const count = document.createElement('span');
    count.className = 'chip-toolbar-count';
    count.textContent = t('ui.toolbar.count', { n: sel.length });
    host.appendChild(count);

    if (allKeyword) {
      const opLabel = document.createElement('label');
      opLabel.className = 'chip-toolbar-op-label';
      opLabel.textContent = t('ui.toolbar.opLabel');
      const select = document.createElement('select');
      select.className = 'chip-toolbar-select';
      select.setAttribute('aria-label', t('ui.toolbar.opAria'));
      // Determine whether all selected share a single operator value;
      // if so, default the dropdown to that. Otherwise show a mixed marker.
      const ops = new Set(sel.map(c => c.props.operator || 'none'));
      if (ops.size > 1) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = t('ui.toolbar.opMixed');
        opt.disabled = true;
        opt.selected = true;
        select.appendChild(opt);
      }
      const operatorKeys = getOperatorKeysForActive();
      const operators = getOperatorsForActive();
      operatorKeys.forEach(key => {
        const o = operators[key];
        if (!o) return;
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = t(o.label);
        if (ops.size === 1 && Array.from(ops)[0] === key) opt.selected = true;
        select.appendChild(opt);
      });
      select.addEventListener('change', (e) => {
        const v = e.target.value;
        if (!v) return;
        sel.forEach(c => chipState.update(c.id, { operator: v }));
      });
      opLabel.appendChild(select);
      host.appendChild(opLabel);
    }

    if (allNegatable) {
      const negBtn = document.createElement('button');
      negBtn.type = 'button';
      negBtn.className = 'chip-toolbar-btn';
      negBtn.textContent = allNegated ? t('ui.toolbar.unnegate') : t('ui.toolbar.negate');
      negBtn.setAttribute('aria-pressed', allNegated ? 'true' : 'false');
      negBtn.addEventListener('click', () => {
        const next = !allNegated;
        sel.forEach(c => chipState.update(c.id, { negate: next }));
      });
      host.appendChild(negBtn);
    }

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'chip-toolbar-btn chip-toolbar-btn-danger';
    delBtn.textContent = t('ui.toolbar.delete');
    delBtn.addEventListener('click', () => {
      sel.forEach(c => chipState.remove(c.id));
      selection.clear();
    });
    host.appendChild(delBtn);

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'chip-toolbar-btn';
    clearBtn.textContent = t('ui.toolbar.clearSelection');
    clearBtn.addEventListener('click', () => selection.clear());
    host.appendChild(clearBtn);
  }

  selection.subscribe(render);
  chipState.subscribe(render);
  if (lang && lang.on) lang.on(() => {
    host.setAttribute('aria-label', t('ui.toolbar.ariaLabel'));
    render();
  });
  render();
}
