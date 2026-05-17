// Engine-driven recipe templates. The active engine's `templates` field is
// read for the legacy 3-card row; the new panel reads `idioms` instead.

import { getActiveEngine } from '../core/engine.js';

/**
 * @typedef {object} Template
 * @property {string} id              stable identifier
 * @property {string} title           Arabic heading line
 * @property {string} description     Arabic one-line description (muted)
 * @property {string} icon            single emoji shown next to the title
 * @property {(chipState: object) => void} apply  mutates chip-state to seed chips
 * @property {string} [pattern]       optional mono LTR string for the operator recipe (idiom panel only)
 * @property {string} [group]         optional group slug (idiom panel only)
 */

/** Active-engine template list. */
export function getTemplates() {
  const eng = getActiveEngine();
  return eng.templates || [];
}

/**
 * Apply a template by id and (optionally) move focus to the composer.
 * Returns true if the template was found and applied.
 *
 * @param {string} id
 * @param {{ chipState: object, focusComposer?: () => void }} deps
 */
export function applyTemplate(id, { chipState, focusComposer }) {
  const tpl = getTemplates().find(t => t.id === id);
  if (!tpl) return false;
  tpl.apply(chipState);
  if (focusComposer) setTimeout(focusComposer, 100);
  return true;
}

/**
 * Backwards-compatible wiring for any fixed-DOM mount points (template-site,
 * template-docs, template-daterange). In the current build the standalone
 * row was removed in favour of the empty-state render, so this is a no-op
 * unless an older shell is loaded.
 *
 * @param {object} args
 * @param {object} args.chipState
 * @param {() => void} [args.focusComposer]
 */
export function wireTemplates({ chipState, focusComposer }) {
  getTemplates().forEach(tpl => {
    const btn = document.getElementById('template-' + tpl.id);
    if (!btn) return;
    btn.addEventListener('click', () => applyTemplate(tpl.id, { chipState, focusComposer }));
  });
}
