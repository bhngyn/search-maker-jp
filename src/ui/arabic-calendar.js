import { t } from '../i18n/messages.js';

// Custom calendar widget. Used by the date-range chip when the active UI
// language is Arabic, because native <input type="date"> pickers tie their
// locale to the OS (Safari especially) and ignore the page lang attribute.
//
// Returns a wrapper element + a small handle so the chip can sync external
// updates (e.g. a swap-dates fix) and clean up on remove. Visual silhouette
// matches `.chip-wide-input-date` so swapping engines/languages doesn't
// shift the chip's footprint.

let activePopup = null;
let activeAnchor = null;
let onOutsideHandler = null;
let onKeyHandler = null;
let onResizeHandler = null;

function closeActive() {
  if (activePopup) {
    activePopup.remove();
    activePopup = null;
    activeAnchor = null;
  }
  if (onOutsideHandler) document.removeEventListener('click', onOutsideHandler, true);
  if (onKeyHandler) document.removeEventListener('keydown', onKeyHandler);
  if (onResizeHandler) window.removeEventListener('resize', onResizeHandler);
  onOutsideHandler = null;
  onKeyHandler = null;
  onResizeHandler = null;
}

function pad2(n) { return n < 10 ? '0' + n : '' + n; }

function formatIso(d) {
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

function parseIso(s) {
  if (!s || typeof s !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = +m[1], mo = +m[2] - 1, da = +m[3];
  const d = new Date(y, mo, da);
  if (d.getFullYear() !== y || d.getMonth() !== mo || d.getDate() !== da) return null;
  return d;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildPopup(anchor, currentValue, onPick) {
  const months = t('chip.dateRange.calendar.months');
  const weekdays = t('chip.dateRange.calendar.weekdays');

  const selected = parseIso(currentValue);
  const today = new Date();
  // Cursor month: the month displayed in the header. Defaults to the
  // selected date's month, otherwise today's month.
  let cursor = new Date((selected || today).getFullYear(), (selected || today).getMonth(), 1);

  const pop = document.createElement('div');
  pop.className = 'date-picker-popup';
  pop.setAttribute('role', 'dialog');

  const header = document.createElement('div');
  header.className = 'date-picker-header';

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'date-picker-nav';
  prev.setAttribute('aria-label', t('chip.dateRange.calendar.prevAria'));
  prev.textContent = '‹';

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'date-picker-nav';
  next.setAttribute('aria-label', t('chip.dateRange.calendar.nextAria'));
  next.textContent = '›';

  const title = document.createElement('span');
  title.className = 'date-picker-title';

  // Header order in the DOM: title in the center, prev/next on either side.
  // We want prev to navigate backwards regardless of dir; in RTL the visual
  // order swaps automatically, so we put prev first in source order.
  header.appendChild(prev);
  header.appendChild(title);
  header.appendChild(next);

  const weekdayRow = document.createElement('div');
  weekdayRow.className = 'date-picker-weekdays';
  for (let i = 0; i < 7; i++) {
    const w = document.createElement('span');
    w.className = 'date-picker-weekday';
    w.textContent = weekdays[i];
    weekdayRow.appendChild(w);
  }

  const grid = document.createElement('div');
  grid.className = 'date-picker-grid';

  function renderGrid() {
    title.textContent = months[cursor.getMonth()] + ' ' + cursor.getFullYear();
    grid.innerHTML = '';
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    // Leading neighbor days: getDay() returns 0 for Sunday, which matches
    // our Sunday-first weekday header.
    const lead = firstOfMonth.getDay();
    const start = new Date(year, month, 1 - lead);

    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'date-picker-day';
      if (d.getMonth() !== month) cell.classList.add('date-picker-day--other-month');
      if (sameDay(d, today)) cell.classList.add('date-picker-day--today');
      if (selected && sameDay(d, selected)) cell.classList.add('date-picker-day--selected');
      cell.textContent = '' + d.getDate();
      cell.addEventListener('click', (e) => {
        e.stopPropagation();
        onPick(formatIso(d));
        closeActive();
      });
      grid.appendChild(cell);
    }
  }

  prev.addEventListener('click', (e) => {
    e.stopPropagation();
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
    renderGrid();
  });
  next.addEventListener('click', (e) => {
    e.stopPropagation();
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    renderGrid();
  });

  pop.appendChild(header);
  pop.appendChild(weekdayRow);
  pop.appendChild(grid);
  renderGrid();

  // Position: same idiom as chip-popover.js — anchor.getBoundingClientRect()
  // for fixed positioning, then flip above + clamp horizontally.
  const rect = anchor.getBoundingClientRect();
  pop.style.position = 'fixed';
  pop.style.zIndex = '1000';
  pop.style.top = (rect.bottom + 6) + 'px';
  pop.style.left = rect.left + 'px';
  document.body.appendChild(pop);

  const margin = 8;
  const popRect = pop.getBoundingClientRect();
  if (popRect.bottom > window.innerHeight - margin) {
    pop.style.top = (rect.top - popRect.height - 6) + 'px';
    pop.classList.add('date-picker-popup--above');
  }
  const maxLeft = window.innerWidth - popRect.width - margin;
  pop.style.left = Math.max(margin, Math.min(rect.left, maxLeft)) + 'px';

  return pop;
}

function openPopup(anchor, currentValue, onPick) {
  if (activeAnchor === anchor) {
    closeActive();
    return;
  }
  closeActive();
  const pop = buildPopup(anchor, currentValue, onPick);
  activePopup = pop;
  activeAnchor = anchor;
  onOutsideHandler = (e) => {
    if (!activePopup) return;
    if (activePopup.contains(e.target)) return;
    if (activeAnchor && activeAnchor.contains(e.target)) return;
    closeActive();
  };
  onKeyHandler = (e) => { if (e.key === 'Escape') closeActive(); };
  onResizeHandler = () => closeActive();
  setTimeout(() => {
    document.addEventListener('click', onOutsideHandler, true);
    document.addEventListener('keydown', onKeyHandler);
    window.addEventListener('resize', onResizeHandler);
  }, 0);
}

/**
 * Build a custom calendar input. Replaces a native <input type="date">
 * for the date-range chip when the UI language is Arabic.
 *
 * @param {object} args
 * @param {string} args.value - initial YYYY-MM-DD value (or empty)
 * @param {(iso: string) => void} args.onChange - called with empty string on clear
 * @param {string} [args.ariaLabel]
 * @returns {{ el: HTMLElement, setValue: (v: string) => void, destroy: () => void }}
 */
export function createArabicDateInput({ value, onChange, ariaLabel }) {
  let current = value || '';

  const wrap = document.createElement('span');
  wrap.className = 'date-trigger-wrap';

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'chip-wide-input chip-wide-input-date date-trigger';
  if (ariaLabel) trigger.setAttribute('aria-label', ariaLabel);

  const valueLabel = document.createElement('span');
  valueLabel.className = 'date-trigger-label';

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'date-trigger-clear';
  clearBtn.setAttribute('aria-label', t('chip.dateRange.calendar.clearAria'));
  clearBtn.textContent = '×';

  function refresh() {
    if (current) {
      valueLabel.textContent = current;
      valueLabel.classList.remove('date-trigger-label--placeholder');
      clearBtn.style.display = '';
    } else {
      valueLabel.textContent = t('chip.dateRange.calendar.placeholder');
      valueLabel.classList.add('date-trigger-label--placeholder');
      clearBtn.style.display = 'none';
    }
  }

  trigger.appendChild(valueLabel);
  wrap.appendChild(trigger);
  wrap.appendChild(clearBtn);

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    openPopup(trigger, current, (iso) => {
      current = iso;
      refresh();
      onChange(iso);
    });
  });

  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!current) return;
    current = '';
    refresh();
    onChange('');
    if (activeAnchor === trigger) closeActive();
  });

  refresh();

  return {
    el: wrap,
    setValue(v) {
      current = v || '';
      refresh();
    },
    destroy() {
      if (activeAnchor === trigger) closeActive();
    },
  };
}
