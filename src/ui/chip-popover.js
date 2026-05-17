import { t } from '../i18n/messages.js';

// Per-chip warning glyph + popover.
//
// A chip type module exports `validate(chip)` returning an array of issues:
//   { severity: 'warning' | 'tip', message: string, fix?: { label, apply() } }
//
// The chip type's render() calls `renderWarningGlyph(chip, issues, handlers)`
// to get a button DOM element to append. Clicking the glyph opens a
// popover with the issues + an optional one-tap fix. The popover is
// appended to document.body and positioned via getBoundingClientRect, so
// it floats above the sticky preview and other chip area elements.

let activePopover = null;
let activeAnchor = null;

function closeActive() {
  if (activePopover) {
    activePopover.remove();
    activePopover = null;
    activeAnchor = null;
    document.removeEventListener('click', onOutside, true);
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
  }
}

function onResize() {
  // Re-flowing the popover is more work than it's worth; the user can
  // re-open it to see the current geometry.
  closeActive();
}

function onOutside(e) {
  if (!activePopover) return;
  if (activePopover.contains(e.target)) return;
  if (activeAnchor && activeAnchor.contains(e.target)) return;
  closeActive();
}

function onKey(e) {
  if (e.key === 'Escape') closeActive();
}

function openPopover(anchor, issues, handlers) {
  closeActive();
  const pop = document.createElement('div');
  pop.className = 'chip-warning-popover';
  pop.setAttribute('role', 'dialog');
  pop.setAttribute('aria-label', t('ui.popover.ariaLabel'));

  issues.forEach(issue => {
    const wrap = document.createElement('div');
    wrap.className = 'chip-warning-popover-issue chip-warning-popover-issue-' + issue.severity;

    const icon = document.createElement('span');
    icon.className = 'chip-warning-popover-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = issue.severity === 'warning' ? '⚠️' : 'ℹ️';
    wrap.appendChild(icon);

    const body = document.createElement('div');
    body.className = 'chip-warning-popover-body';

    const msg = document.createElement('p');
    msg.className = 'chip-warning-popover-msg';
    msg.textContent = issue.message;
    body.appendChild(msg);

    if (issue.fix && handlers && typeof handlers.onChangeProps === 'function') {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip-warning-popover-fix';
      btn.textContent = issue.fix.label;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        try {
          const patch = issue.fix.apply();
          if (patch && typeof patch === 'object') handlers.onChangeProps(patch);
        } catch (err) {
          console.warn('fix apply failed', err);
        }
        closeActive();
      });
      body.appendChild(btn);
    }

    wrap.appendChild(body);
    pop.appendChild(wrap);
  });

  const rect = anchor.getBoundingClientRect();
  pop.style.position = 'fixed';
  pop.style.zIndex = '1000';
  pop.style.maxWidth = '300px';
  // Initial placement (below anchor, leading-edge aligned) so the browser
  // can lay it out and produce a real bounding box for clamp-fitting.
  pop.style.top = (rect.bottom + 6) + 'px';
  pop.style.left = rect.left + 'px';
  document.body.appendChild(pop);

  // Vertical: flip above the anchor if the popover would overflow the
  // bottom edge (typical when a chip sits near the sticky preview).
  const popRect = pop.getBoundingClientRect();
  const margin = 8;
  if (popRect.bottom > window.innerHeight - margin) {
    const flippedTop = rect.top - popRect.height - 6;
    pop.style.top = flippedTop + 'px';
    pop.classList.add('chip-warning-popover-above');
  }

  // Horizontal: clamp to the viewport so neither edge is clipped.
  const desiredLeft = rect.left;
  const maxLeft = window.innerWidth - popRect.width - margin;
  const clampedLeft = Math.max(margin, Math.min(desiredLeft, maxLeft));
  pop.style.left = clampedLeft + 'px';

  activePopover = pop;
  activeAnchor = anchor;

  setTimeout(() => {
    document.addEventListener('click', onOutside, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
  }, 0);
}

/**
 * Build the glyph button for a chip's issue list. Returns null if the
 * issue list is empty so callers can `if (glyph) el.appendChild(glyph)`.
 *
 * @param {object} chip
 * @param {Array<{ severity: 'warning' | 'tip', message: string, fix?: { label: string, apply: () => object } }>} issues
 * @param {{ onChangeProps?: (patch: object) => void }} handlers
 * @returns {HTMLButtonElement | null}
 */
export function renderWarningGlyph(chip, issues, handlers) {
  if (!issues || issues.length === 0) return null;
  const severity = issues.some(i => i.severity === 'warning') ? 'warning' : 'tip';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'chip-warning-glyph chip-warning-glyph-' + severity;
  btn.textContent = severity === 'warning' ? '⚠' : 'ℹ';
  btn.title = issues.map(i => i.message).join(' • ');
  btn.setAttribute('aria-label', t('ui.popover.glyphAriaLabel', { text: btn.title }));
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (activeAnchor === btn) {
      closeActive();
    } else {
      openPopover(btn, issues, handlers);
    }
  });
  return btn;
}
