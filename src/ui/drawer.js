// "+ إضافة" drawer — exposes specialized chip types (filetype, date-range,
// proximity, number-range) plus shortcuts to common operator keyword chips
// (site, intitle, etc.).
//
// Each item is a two-line + badge structure: a user-language Arabic label,
// a muted one-line description, and a trailing-edge mono badge with the
// technical operator name so users gradually learn the syntax.
//
// The drawer renders as a popover anchored to its trigger button. Clicking
// outside or pressing Escape closes it.

// Items, ordering, and grouping all live on the active engine descriptor
// (see src/engines/<id>.js `drawer` field). Each engine declares its own
// keyword-operator items, specialized chip items, and beginner / advanced
// orderings. The drawer reads them lazily so an engine switch immediately
// shows the right set without manual rebinding.
import { getActiveEngine } from '../core/engine.js';
import { t } from '../i18n/messages.js';

function getDrawerSpec() {
  const eng = getActiveEngine();
  return eng.drawer || { items: {}, beginnerOrder: [], beginnerMore: [], advancedKeywords: [], advancedSpecials: [] };
}

/**
 * @param {object} args
 * @param {HTMLElement} args.trigger - the button that opens the drawer
 * @param {{ add: Function }} args.chipState
 * @param {{ on?: (cb: Function) => void }} [args.engine] - close drawer on engine switch
 */
export function wireDrawer({ trigger, chipState, engine }) {
  let panel = null;

  function close() {
    if (panel) { panel.remove(); panel = null; }
    trigger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', onOutsideClick, true);
    document.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', onResize);
  }

  function onOutsideClick(e) {
    if (!panel) return;
    if (panel.contains(e.target) || trigger.contains(e.target)) return;
    close();
  }

  function onKey(e) {
    if (e.key === 'Escape') close();
  }

  function clickFor(item) {
    if (item.kind === 'keyword') {
      const props = { operator: item.operator };
      if (item.text != null) props.text = item.text;
      return () => chipState.add('keyword', props);
    }
    return () => chipState.add(item.type, item.props || {});
  }

  function buildItem(key) {
    const items = getDrawerSpec().items;
    const item = items[key];
    if (!item) return null;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'drawer-item';
    // The badge is a Latin operator name; keep it explicitly LTR so it
    // renders correctly inside the RTL panel.
    const descHtml = item.desc ? `<span class="drawer-item-desc">${t(item.desc)}</span>` : '';
    btn.innerHTML = `
      <span class="drawer-item-text">
        <span class="drawer-item-label">${t(item.label)}</span>
        ${descHtml}
      </span>
      <span class="drawer-item-badge" dir="ltr">${item.badge}</span>
    `;
    const onClick = clickFor(item);
    btn.addEventListener('click', () => { onClick(); close(); });
    return btn;
  }

  function buildSection(headingText) {
    const section = document.createElement('div');
    section.className = 'drawer-section';
    if (headingText) {
      const heading = document.createElement('div');
      heading.className = 'drawer-section-heading';
      heading.textContent = headingText;
      section.appendChild(heading);
    }
    return section;
  }

  function buildPanel() {
    const root = document.createElement('div');
    root.className = 'drawer-panel';
    root.setAttribute('role', 'menu');

    const spec = getDrawerSpec();
    function appendItem(parent, key) {
      const node = buildItem(key);
      if (node) parent.appendChild(node);
    }

    // Predictable section grouping: keyword operators, social-media site
    // shortcuts (optional, Google-only today), then specials.
    if ((spec.advancedKeywords || []).length > 0) {
      const opsSection = buildSection(t('ui.drawer.advancedKeywordsHeading'));
      spec.advancedKeywords.forEach(key => appendItem(opsSection, key));
      root.appendChild(opsSection);
    }

    if ((spec.advancedSocial || []).length > 0) {
      const socialSection = buildSection(t('ui.drawer.advancedSocialHeading'));
      spec.advancedSocial.forEach(key => appendItem(socialSection, key));
      root.appendChild(socialSection);
    }

    if ((spec.advancedSpecials || []).length > 0) {
      const specialsSection = buildSection(t('ui.drawer.advancedSpecialsHeading'));
      spec.advancedSpecials.forEach(key => appendItem(specialsSection, key));
      root.appendChild(specialsSection);
    }

    return root;
  }

  // Place the panel so all items are reachable. Default is below the
  // trigger; if there isn't room below, flip above. Either way clamp
  // max-height to the actually-available space so internal scroll is
  // reachable rather than relying on a fixed 60vh that may overflow the
  // viewport bottom (the original bug).
  function position() {
    if (!panel) return;
    const VGAP = 6;          // gap between trigger and panel
    const VEDGE = 8;          // breathing room at viewport edges
    const HEDGE = 8;          // breathing room left/right
    const triggerRect = trigger.getBoundingClientRect();
    const vpH = window.innerHeight;
    const vpW = window.innerWidth;

    const spaceBelow = vpH - triggerRect.bottom - VGAP - VEDGE;
    const spaceAbove = triggerRect.top - VGAP - VEDGE;

    // Measure natural content height (cap at 70vh as an upper bound).
    panel.style.maxHeight = 'none';
    const contentH = panel.scrollHeight;
    const upperBound = Math.min(Math.round(vpH * 0.7), 600);

    const flipAbove = spaceBelow < Math.min(contentH, 280) && spaceAbove > spaceBelow;
    const avail = flipAbove ? spaceAbove : spaceBelow;
    const targetH = Math.min(contentH, avail, upperBound);

    panel.style.position = 'fixed';
    panel.style.maxHeight = targetH + 'px';

    if (flipAbove) {
      panel.style.top = Math.max(VEDGE, triggerRect.top - VGAP - targetH) + 'px';
    } else {
      panel.style.top = (triggerRect.bottom + VGAP) + 'px';
    }

    // Horizontal: anchor to trigger's inline-start edge in RTL, then clamp
    // so the panel stays inside the viewport on narrow widths.
    const panelW = panel.offsetWidth;
    let left = triggerRect.left;
    if (left + panelW > vpW - HEDGE) left = vpW - panelW - HEDGE;
    if (left < HEDGE) left = HEDGE;
    panel.style.insetInlineStart = 'auto';
    panel.style.left = left + 'px';
  }

  function onResize() { position(); }

  function open() {
    if (panel) { close(); return; }
    panel = buildPanel();
    document.body.appendChild(panel);
    position();
    trigger.setAttribute('aria-expanded', 'true');
    window.addEventListener('resize', onResize);
    // Re-position when the disclosure inside the panel toggles, since
    // expanding/collapsing changes scrollHeight and may now fit/overflow.
    panel.addEventListener('toggle', position, true);
    // Bind closers AFTER attachment so the opening click doesn't immediately close.
    setTimeout(() => {
      document.addEventListener('click', onOutsideClick, true);
      document.addEventListener('keydown', onKey);
    }, 0);
  }

  trigger.setAttribute('aria-haspopup', 'menu');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.addEventListener('click', () => {
    if (panel) close(); else open();
  });

  // Close any open drawer on engine switch — the items would be invalid
  // for the new engine. The user re-opens to see the new surface.
  if (engine && typeof engine.on === 'function') {
    engine.on(() => { if (panel) close(); });
  }
}
