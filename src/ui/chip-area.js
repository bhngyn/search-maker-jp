// Chip area — renders the committed chips. Subscribes to chip-state and
// re-renders on every change. Each chip type renders itself; this module
// just wires delete/toggle handlers, stitches chips into the DOM in order,
// and (in Advanced mode) wires HTML5 drag-and-drop for reordering plus
// Shift-click multi-select.
//
// RTL note: the chip area uses `dir="rtl"` from the document. Newest chips
// appear on the LEADING edge in RTL flow (i.e. visually on the left when
// reading right-to-left).

import { chipTypes } from '../chips/_registry.js';
import { t } from '../i18n/messages.js';

/**
 * Selection observable shared with the bulk-actions toolbar. A simple
 * Set-of-ids store with subscribe + notify.
 */
export function createChipSelection() {
  const ids = new Set();
  const subscribers = [];
  function notify() { subscribers.forEach(cb => { try { cb(new Set(ids)); } catch (e) { console.warn(e); } }); }
  return {
    get() { return ids; },
    has(id) { return ids.has(id); },
    add(id) { if (!ids.has(id)) { ids.add(id); notify(); } },
    remove(id) { if (ids.has(id)) { ids.delete(id); notify(); } },
    toggle(id) { if (ids.has(id)) ids.delete(id); else ids.add(id); notify(); },
    clear() { if (ids.size > 0) { ids.clear(); notify(); } },
    subscribe(cb) { subscribers.push(cb); return () => { const i = subscribers.indexOf(cb); if (i >= 0) subscribers.splice(i, 1); }; },
  };
}

/**
 * @param {object} args
 * @param {HTMLElement} args.host
 * @param {{ subscribe: Function, getAll: Function, remove: Function, update: Function, clear: Function, reorder?: Function }} args.chipState
 * @param {ReturnType<typeof createChipSelection>} [args.selection]
 * @param {() => void} [args.focusComposer]  used by the empty-state templates to focus the composer after applying
 * @param {(chipId: string) => void} [args.onChipHighlight]  invoked when a chip is added or focused; preview uses it to flash the matching fragment
 */
export function wireChipArea({ host, chipState, selection, focusComposer, onChipHighlight, engine, lang }) {
  host.classList.add('chip-area');
  host.setAttribute('aria-live', 'polite');
  host.setAttribute('aria-relevant', 'additions removals');

  let draggedChipId = null;

  function isOrKindConnector(c) {
    return c && c.type === 'or-connector' && (c.props == null || c.props.kind !== 'and');
  }
  function isAndKindConnector(c) {
    return c && c.type === 'or-connector' && c.props && c.props.kind === 'and';
  }

  function render() {
    const chips = chipState.getAll();
    if (chips.length === 0) {
      renderEmptyState();
      host.classList.remove('chip-area-draggable');
      return;
    }
    host.classList.add('chip-area-draggable');
    host.classList.remove('chip-area-is-empty');
    host.innerHTML = '';
    // Build a per-index map of OR-group containers. We walk chips and group
    // any contiguous run of [keyword, or-connector(kind=or), keyword, ...]
    // into a single .chip-or-group span. AND-kind connectors break the run
    // and render as standalone connector chips. Non-grouped chips render
    // directly into host. The grouping is render-only — chip-state stays flat.
    const groupRanges = computeOrGroupRanges(chips);
    let cursor = 0;
    let unitsRendered = 0;
    let prevWasConnector = false;
    while (cursor < chips.length) {
      const groupEnd = groupRanges.get(cursor);
      if (typeof groupEnd === 'number') {
        // [cursor .. groupEnd] is one OR group (inclusive on both ends).
        if (unitsRendered > 0 && !prevWasConnector) appendAndSeam(host);
        host.appendChild(renderOrGroup(chips, cursor, groupEnd));
        cursor = groupEnd + 1;
        unitsRendered++;
        prevWasConnector = false;
      } else {
        const c = chips[cursor];
        if (isAndKindConnector(c)) {
          // AND-kind connector renders inline as a real chip — its presence
          // IS the separator between the surrounding terms, so suppress the
          // implicit AND seam on either side.
          appendChipEl(host, c);
          cursor++;
          unitsRendered++;
          prevWasConnector = true;
          continue;
        }
        if (c && c.type === 'or-connector') {
          // Stale OR connector outside a complete [term, OR, term] run.
          // cleanupConnectors() should prevent this; skip defensively.
          cursor++;
          continue;
        }
        if (unitsRendered > 0 && !prevWasConnector) appendAndSeam(host);
        appendChipEl(host, c);
        cursor++;
        unitsRendered++;
        prevWasConnector = false;
      }
    }
  }

  /**
   * Render a `[term, OR, term, ...]` run as a single OR-group container with
   * an explicit header + a trailing "+ بديل آخر" button. Group members do
   * not get the per-chip "+أو" handle (the trailing button is the single
   * discoverable add affordance once a group exists).
   */
  function renderOrGroup(chips, start, end) {
    const groupEl = document.createElement('span');
    groupEl.className = 'chip-or-group';
    groupEl.setAttribute('role', 'group');
    groupEl.setAttribute('aria-label', t('ui.chipArea.orGroupAriaLabel'));

    // Header row.
    const labelEl = document.createElement('span');
    labelEl.className = 'chip-or-group-label';
    labelEl.setAttribute('aria-hidden', 'true');
    const icon = document.createElement('span');
    icon.className = 'chip-or-group-icon';
    icon.textContent = '⫦';
    const labelText = document.createElement('span');
    labelText.className = 'chip-or-group-label-text';
    labelText.textContent = t('ui.chipArea.orGroupLabel');
    const helper = document.createElement('span');
    helper.className = 'chip-or-group-label-helper';
    helper.textContent = t('ui.chipArea.orGroupHelper');
    labelEl.appendChild(icon);
    labelEl.appendChild(labelText);
    labelEl.appendChild(helper);
    groupEl.appendChild(labelEl);

    // Members — suppress the per-chip "+أو" handle inside the group.
    for (let i = start; i <= end; i++) {
      appendChipEl(groupEl, chips[i], { inOrGroup: true });
    }

    // Trailing add button. Calls addOrBranch on the LAST member; addOrBranch
    // already walks forward to the end of the run before splicing, so this
    // works whether the group has 2 or N members.
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'chip-or-group-add';
    addBtn.textContent = t('ui.chipArea.orGroupAdd');
    addBtn.title = t('ui.chipArea.orGroupAddTitle');
    addBtn.setAttribute('aria-label', t('ui.chipArea.orGroupAddTitle'));
    const lastMemberId = chips[end].id;
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      addOrBranch(lastMemberId);
    });
    groupEl.appendChild(addBtn);

    return groupEl;
  }

  function appendAndSeam(parent) {
    const seam = document.createElement('span');
    seam.className = 'chip-and-seam';
    seam.setAttribute('aria-hidden', 'true');
    seam.textContent = t('ui.chipArea.andSeam');
    parent.appendChild(seam);
  }

  /**
   * Render the empty-state DOM: a single muted hint line.
   */
  function renderEmptyState() {
    host.innerHTML = '';
    host.classList.add('chip-area-is-empty');
    const hint = document.createElement('p');
    hint.className = 'chip-area-empty-hint';
    hint.textContent = t('ui.chipArea.emptyHint');
    host.appendChild(hint);
  }

  /**
   * Returns a Map of startIndex → endIndex (inclusive) describing every
   * contiguous OR run of [term, OR, term, OR, term, ...]. A run requires
   * at least one connector, so a single keyword chip is never "in a group."
   */
  function computeOrGroupRanges(chips) {
    const ranges = new Map();
    let i = 0;
    while (i < chips.length) {
      const c = chips[i];
      if (!c || c.type === 'or-connector') { i++; continue; }
      // Walk forward across [term, OR(kind=or), term, ...] pairs. AND-kind
      // connectors break the run.
      let end = i;
      while (
        end + 2 < chips.length &&
        isOrKindConnector(chips[end + 1]) &&
        chips[end + 2] && chips[end + 2].type !== 'or-connector'
      ) {
        end += 2;
      }
      if (end > i) ranges.set(i, end);
      i = end + 1;
    }
    return ranges;
  }

  function appendChipEl(parent, chip, opts) {
    const mod = chipTypes[chip.type];
    if (!mod || typeof mod.render !== 'function') return;
    const inOrGroup = !!(opts && opts.inOrGroup);
    const el = mod.render(chip, {
      onDelete: () => chipState.remove(chip.id),
      onToggleNegate: () => chipState.update(chip.id, { negate: !chip.props.negate }),
      onToggleQuoted: () => chipState.update(chip.id, { quoted: !chip.props.quoted }),
      onChangeOperator: (op) => chipState.update(chip.id, { operator: op }),
      onChangeText: (text) => chipState.update(chip.id, { text }),
      onChangeProps: (patch) => chipState.update(chip.id, patch),
      // Suppress the per-chip "+أو" handle inside an OR group — the
      // group's single trailing "+ بديل آخر" button takes over there.
      onAddOrBranch: inOrGroup ? null : () => addOrBranch(chip.id),
    });
    if (selection && selection.has(chip.id)) el.classList.add('chip-selected');
    if (selection) wireSelectionClick(el, chip.id);
    if (chipState.reorder) {
      wireDrag(el, chip.id);
    }
    parent.appendChild(el);
  }

  /**
   * Splice an or-connector + fresh empty keyword chip after the LAST
   * member of the OR run that contains `chipId`. If `chipId` isn't already
   * in a run, this just appends after the chip itself, which still creates
   * a valid run because the new keyword chip is also a term.
   */
  function addOrBranch(chipId) {
    if (!chipState.addAfter) return;
    const all = chipState.getAll();
    let idx = all.findIndex(c => c.id === chipId);
    if (idx < 0) return;
    // Walk forward through [OR(kind=or), term] pairs to find the end of the
    // contiguous OR run. AND-kind connectors break the run.
    while (
      idx + 2 < all.length &&
      isOrKindConnector(all[idx + 1]) &&
      all[idx + 2] && all[idx + 2].type !== 'or-connector'
    ) {
      idx += 2;
    }
    const anchorId = all[idx].id;
    const connectorId = chipState.addAfter(anchorId, 'or-connector', {});
    if (!connectorId) return;
    const newChipId = chipState.addAfter(connectorId, 'keyword', { text: '', operator: 'none' });
    if (!newChipId) return;
    // After re-render, focus the new chip's editable text.
    requestAnimationFrame(() => {
      const newEl = host.querySelector('[data-chip-id="' + newChipId + '"] .chip-text');
      if (newEl && typeof newEl.focus === 'function') newEl.focus();
    });
  }

  function wireSelectionClick(el, chipId) {
    el.addEventListener('click', (e) => {
      // Don't intercept clicks on inner editable / interactive widgets.
      if (e.target && e.target.closest && e.target.closest('button, select, input, textarea, [contenteditable]')) return;
      if (e.shiftKey) {
        e.preventDefault();
        selection.toggle(chipId);
      } else if (selection.get().size > 0) {
        // Plain click with an active selection clears it.
        selection.clear();
      }
    });
  }

  function wireDrag(el, chipId) {
    el.draggable = true;
    el.classList.add('chip-draggable');
    // Make the chip itself focusable so keyboard users can target the
    // reorder handlers without going through inner editable widgets.
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
    el.title = t('ui.chipArea.dragHint');
    el.addEventListener('dragstart', (e) => {
      const target = e.target;
      if (target && target.matches && target.matches('[contenteditable], input, select, textarea, button')) {
        e.preventDefault();
        return;
      }
      draggedChipId = chipId;
      el.classList.add('chip-dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', chipId); } catch (_) {}
    });
    el.addEventListener('dragend', () => {
      el.classList.remove('chip-dragging');
      clearDropIndicator();
      draggedChipId = null;
    });
    // Alt+Arrow nudges the chip forward/back in the array. We use Alt
    // so plain arrow keys remain available for cursor movement inside
    // the chip's contenteditable text. After a reorder the chip array
    // re-renders; focus the moved chip via data-chip-id so the user can
    // keep nudging.
    el.addEventListener('keydown', (e) => {
      if (!e.altKey) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (!chipState.reorder) return;
      const all = chipState.getAll();
      const idx = all.findIndex(c => c.id === chipId);
      if (idx < 0) return;
      const delta = e.key === 'ArrowRight' ? 1 : -1;
      const target = idx + delta;
      if (target < 0 || target > all.length - 1) return;
      e.preventDefault();
      e.stopPropagation();
      chipState.reorder(chipId, target);
      requestAnimationFrame(() => {
        const moved = host.querySelector('[data-chip-id="' + chipId + '"]');
        if (moved && typeof moved.focus === 'function') moved.focus();
      });
    });
  }

  function clearDropIndicator() {
    host.querySelectorAll('.chip-drop-target-before, .chip-drop-target-after').forEach(c => {
      c.classList.remove('chip-drop-target-before', 'chip-drop-target-after');
    });
  }

  function computeInsertIndex(clientX, clientY) {
    const visible = Array.from(host.querySelectorAll('.chip:not(.chip-dragging)'));
    if (visible.length === 0) return { index: 0, placement: null, anchor: null };

    let closest = null;
    let closestDist = Infinity;
    let closestIdx = -1;
    visible.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const d = Math.hypot(clientX - cx, clientY - cy);
      if (d < closestDist) {
        closestDist = d;
        closest = el;
        closestIdx = i;
      }
    });

    if (!closest) return { index: visible.length, placement: null, anchor: null };

    const r = closest.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    // RTL: "before in array order" = "to the right visually" (higher x).
    const before = clientX > cx;
    return {
      index: before ? closestIdx : closestIdx + 1,
      placement: before ? 'before' : 'after',
      anchor: closest,
    };
  }

  function paintDropIndicator(anchor, placement) {
    clearDropIndicator();
    if (!anchor) return;
    if (placement === 'before') anchor.classList.add('chip-drop-target-before');
    else if (placement === 'after') anchor.classList.add('chip-drop-target-after');
  }

  host.addEventListener('dragover', (e) => {
    if (!draggedChipId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const { anchor, placement } = computeInsertIndex(e.clientX, e.clientY);
    paintDropIndicator(anchor, placement);
  });

  host.addEventListener('dragleave', (e) => {
    if (e.relatedTarget && host.contains(e.relatedTarget)) return;
    clearDropIndicator();
  });

  host.addEventListener('drop', (e) => {
    if (!draggedChipId) return;
    e.preventDefault();
    const { index } = computeInsertIndex(e.clientX, e.clientY);
    chipState.reorder(draggedChipId, index);
    clearDropIndicator();
    draggedChipId = null;
  });

  // Esc clears selection.
  if (selection) {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && selection.get().size > 0) selection.clear();
    });
  }

  chipState.subscribe((_chips, change) => {
    render();
    // Flash the preview fragment for the just-added chip so the user sees
    // the visual link between the chip and its piece of the assembled query.
    // Defer to rAF so preview's own re-render (driven by ctx.requestUpdate
    // after the same notify pass) has a chance to mount the fragment span.
    if (change && change.kind === 'add' && change.chip && onChipHighlight) {
      requestAnimationFrame(() => onChipHighlight(change.chip.id));
    }
  });
  if (selection) selection.subscribe(() => render());
  // Engine switch may change empty-state templates and the operator
  // surface visible on existing chips; rerender to pick those up.
  if (engine && engine.on) engine.on(() => render());
  // Lang switch — chip render functions resolve their localized strings on
  // every render, so we just need to re-run render().
  if (lang && lang.on) lang.on(() => render());

  // Focus binding: when a chip element gains focus (tab, click, or focus()
  // call), highlight its fragment in the preview. Uses focusin so it bubbles
  // from inner editable widgets too.
  host.addEventListener('focusin', (e) => {
    if (!onChipHighlight) return;
    const chipEl = e.target && e.target.closest && e.target.closest('[data-chip-id]');
    if (chipEl && chipEl.dataset && chipEl.dataset.chipId) {
      onChipHighlight(chipEl.dataset.chipId);
    }
  });

  render();
}
