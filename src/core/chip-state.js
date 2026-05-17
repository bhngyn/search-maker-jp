// Chip state — the single source of truth for the chip-based query model.
//
// The store is an ordered array of chips. Each chip is
//   { id: string, type: string, props: object }
// where `type` matches a key in chips/_registry.js and `props` is whatever
// that chip type cares about (e.g. { text, negate, quoted } for keyword).
//
// Mutations go through this module's API. Subscribers (the chip-area UI)
// receive the new chip list on every change. The store also registers a
// single segment with ctx.registerSegment(100, ...) that produces the
// chip-assembled query string. The form's existing segments at orders 1–15
// run BEFORE the chip output, so during Phase 4 (when both UIs coexist)
// the visualizer shows form output first, then chip output.
//
// Boolean grammar:
//   adjacent term chips ⇒ implicit AND
//   chip type 'or-connector' between two term chips ⇒ OR group
//   the assembler walks runs of [term, OR, term, OR, term] into "(a OR b OR c)"

import { chipTypes } from '../chips/_registry.js';

let nextId = 1;
function makeId() {
  return 'chip-' + (nextId++) + '-' + Math.random().toString(36).slice(2, 8);
}

/**
 * @param {object} args
 * @param {import('./ctx.js').Ctx} args.ctx
 * @param {number} [args.segmentOrder]
 */
export function createChipState({ ctx, segmentOrder = 100 }) {
  /** @type {Array<{ id: string, type: string, props: object }>} */
  const chips = [];
  /** @type {Array<(chips: Array, change: { kind: string, chip?: any, id?: string }) => void>} */
  const subscribers = [];

  function notify(change) {
    const snapshot = chips.map(c => ({ ...c, props: { ...c.props } }));
    subscribers.forEach(cb => {
      try { cb(snapshot, change); } catch (e) { console.warn('chip subscriber failed', e); }
    });
  }

  function defaultPropsFor(type) {
    const mod = chipTypes[type];
    if (!mod || typeof mod.defaultProps !== 'function') return {};
    return mod.defaultProps();
  }

  /**
   * Append a chip at the end of the list. `props` is merged on top of the
   * type's defaultProps(). Returns the new chip's id.
   */
  function add(type, props = {}, options = {}) {
    if (!chipTypes[type]) {
      console.warn('unknown chip type', type);
      return null;
    }
    const chip = {
      id: makeId(),
      type,
      props: { ...defaultPropsFor(type), ...props },
    };
    if (typeof options.insertAt === 'number') {
      chips.splice(options.insertAt, 0, chip);
    } else {
      chips.push(chip);
    }
    notify({ kind: 'add', chip });
    ctx.requestUpdate();
    return chip.id;
  }

  /**
   * Insert a chip immediately after the chip identified by `afterId`.
   * Returns the new chip's id, or null if `afterId` isn't found or `type`
   * isn't registered. Used by the per-chip "+أو" handle to splice a new
   * connector + keyword pair next to an existing chip without an explicit
   * reorder pass.
   */
  function addAfter(afterId, type, props = {}) {
    if (!chipTypes[type]) {
      console.warn('unknown chip type', type);
      return null;
    }
    const idx = chips.findIndex(c => c.id === afterId);
    if (idx < 0) return null;
    const chip = {
      id: makeId(),
      type,
      props: { ...defaultPropsFor(type), ...props },
    };
    chips.splice(idx + 1, 0, chip);
    // Don't run cleanupConnectors here: the OR-branch flow calls addAfter
    // twice in sequence (connector, then keyword), and cleanup between the
    // two would prune the connector before its trailing term lands. The
    // mutating ops that *can* create stale connectors (remove, reorder)
    // still cleanup themselves, so the invariant holds.
    notify({ kind: 'add', chip });
    ctx.requestUpdate();
    return chip.id;
  }

  function remove(id) {
    const idx = chips.findIndex(c => c.id === id);
    if (idx < 0) return false;
    const [removed] = chips.splice(idx, 1);
    // If removing a term chip leaves two adjacent or-connectors (or trailing),
    // clean those up so the boolean grammar stays valid.
    cleanupConnectors();
    notify({ kind: 'remove', chip: removed });
    ctx.requestUpdate();
    return true;
  }

  /**
   * Bulk-remove. Used by the paste-undo toast so a multi-chip paste can be
   * undone in one click without firing N separate notify() / requestUpdate()
   * passes for the subscribers' eyes (each remove() above already does its
   * own cleanup; the resulting renders coalesce naturally).
   */
  function removeMany(ids) {
    ids.forEach(id => remove(id));
  }

  function update(id, propsPatch) {
    const c = chips.find(c => c.id === id);
    if (!c) return false;
    c.props = { ...c.props, ...propsPatch };
    notify({ kind: 'update', chip: c });
    ctx.requestUpdate();
    return true;
  }

  function clear() {
    chips.length = 0;
    notify({ kind: 'clear' });
    ctx.requestUpdate();
  }

  // Replace the entire chip array with a deep clone of the given snapshot.
  // Used by the history module (undo / redo) to restore a prior state without
  // re-emitting per-chip add/remove notifications. The single 'replace' event
  // lets history's own subscriber distinguish "the user did something" from
  // "we just restored a snapshot" so it can suspend stack pushes during the
  // restore.
  function replaceAll(snapshot) {
    if (!Array.isArray(snapshot)) return;
    chips.length = 0;
    for (const c of snapshot) {
      chips.push({ id: c.id, type: c.type, props: { ...c.props } });
    }
    notify({ kind: 'replace' });
    ctx.requestUpdate();
  }

  /**
   * Move a chip to a new index. `targetIndex` is the position in the
   * post-removal array — i.e. clamped to [0, chips.length - 1] after the
   * dragged chip has been spliced out. Drag-and-drop in chip-area passes
   * an index computed from the visible chip elements (which exclude the
   * one being dragged), so the indices align directly.
   */
  function reorder(id, targetIndex) {
    const oldIdx = chips.findIndex(c => c.id === id);
    if (oldIdx < 0) return false;
    const [chip] = chips.splice(oldIdx, 1);
    if (targetIndex < 0) targetIndex = 0;
    if (targetIndex > chips.length) targetIndex = chips.length;
    chips.splice(targetIndex, 0, chip);
    cleanupConnectors();
    notify({ kind: 'reorder', chip });
    ctx.requestUpdate();
    return true;
  }

  function getAll() {
    return chips.map(c => ({ ...c, props: { ...c.props } }));
  }

  function isTerm(chip) {
    return chip && chip.type !== 'or-connector';
  }

  /**
   * Drop OR connectors that no longer sit between two term chips.
   * Called after every removal so the chip array stays well-formed.
   */
  function cleanupConnectors() {
    for (let i = chips.length - 1; i >= 0; i--) {
      if (chips[i].type !== 'or-connector') continue;
      const prev = chips[i - 1];
      const next = chips[i + 1];
      if (!isTerm(prev) || !isTerm(next)) {
        chips.splice(i, 1);
      }
    }
  }

  function subscribe(cb) {
    subscribers.push(cb);
    return () => {
      const idx = subscribers.indexOf(cb);
      if (idx >= 0) subscribers.splice(idx, 1);
    };
  }

  // ===== Query assembly =====
  ctx.registerSegment(segmentOrder, () => assembleChips(chips, ctx));

  /**
   * Per-chip query fragments for the visual binding between chips and the
   * preview box. Walks the same OR-aware path as assembleChips() but emits
   * a structured list — chip fragments interleaved with separators and
   * group parens — so the preview can wrap each chip's contribution in a
   * span tagged with its id and highlight that span on add/focus.
   *
   * @returns {Array<{ kind: 'chip'|'sep'|'open'|'close', text: string, chipId?: string }>}
   */
  function getQueryFragments() {
    return assembleChipFragments(chips, ctx);
  }

  return {
    add, addAfter, remove, removeMany, update, reorder, clear, replaceAll, getAll, subscribe,
    getQueryFragments,
    /** Last chip in the list, or null. */
    last() { return chips.length ? chips[chips.length - 1] : null; },
  };
}

/**
 * Walk the chip array and produce the assembled query.
 * Uses each chip type's `assemble(chip, ctx)` function. Handles OR runs
 * as `(a OR b OR c)`. Ignores leading/trailing/duplicate or-connectors.
 *
 * @param {Array<{ id: string, type: string, props: object }>} chips
 * @param {import('./ctx.js').Ctx} ctx
 */
function isOrKindConnector(chip) {
  return chip && chip.type === 'or-connector' && (chip.props == null || chip.props.kind !== 'and');
}

function assembleChips(chips, ctx) {
  const parts = [];
  let i = 0;
  while (i < chips.length) {
    const chip = chips[i];
    if (chip.type === 'or-connector') {
      i++;
      continue;
    }
    // Build an OR run starting at this chip. AND-kind connectors break the
    // run — they emit nothing (Google's implicit AND between rendered chunks
    // already represents conjunction).
    const run = [chip];
    while (
      i + 2 < chips.length &&
      isOrKindConnector(chips[i + 1]) &&
      chips[i + 2].type !== 'or-connector'
    ) {
      run.push(chips[i + 2]);
      i += 2;
    }
    const rendered = run.map(c => chipAssemble(c, ctx)).filter(s => s && s.trim());
    if (rendered.length >= 2) {
      parts.push('(' + rendered.join(' OR ') + ')');
    } else if (rendered.length === 1) {
      parts.push(rendered[0]);
    }
    i++;
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

function chipAssemble(chip, ctx) {
  const mod = chipTypes[chip.type];
  if (!mod || typeof mod.assemble !== 'function') return '';
  try {
    return mod.assemble(chip, ctx) || '';
  } catch (e) {
    console.warn('chip assemble failed', chip, e);
    return '';
  }
}

/**
 * Same OR-aware walk as assembleChips, but instead of a flat string returns
 * a fragment list so preview.js can render each chip's contribution inside
 * a span tagged with its id. The string formed by joining .text values is
 * byte-for-byte identical to assembleChips' output.
 */
function assembleChipFragments(chips, ctx) {
  /** @type {Array<{ kind: string, text: string, chipId?: string }>} */
  const out = [];
  let needSep = false;
  const pushSep = () => { if (needSep) { out.push({ kind: 'sep', text: ' ' }); needSep = false; } };

  let i = 0;
  while (i < chips.length) {
    const chip = chips[i];
    if (chip.type === 'or-connector') { i++; continue; }
    const run = [chip];
    while (
      i + 2 < chips.length &&
      isOrKindConnector(chips[i + 1]) &&
      chips[i + 2].type !== 'or-connector'
    ) {
      run.push(chips[i + 2]);
      i += 2;
    }
    const rendered = run
      .map(c => ({ chipId: c.id, text: chipAssemble(c, ctx) }))
      .filter(r => r.text && r.text.trim());
    if (rendered.length >= 2) {
      pushSep();
      out.push({ kind: 'open', text: '(' });
      rendered.forEach((r, idx) => {
        if (idx > 0) out.push({ kind: 'sep', text: ' OR ' });
        out.push({ kind: 'chip', chipId: r.chipId, text: r.text });
      });
      out.push({ kind: 'close', text: ')' });
      needSep = true;
    } else if (rendered.length === 1) {
      pushSep();
      out.push({ kind: 'chip', chipId: rendered[0].chipId, text: rendered[0].text });
      needSep = true;
    }
    i++;
  }
  return out;
}
