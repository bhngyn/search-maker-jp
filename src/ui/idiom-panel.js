// Recipe-library panel — "Investigator's Playbook" redesign.
//
// Three-axis state machine driven by data attributes on the host <section>:
//
//   data-state         "closed" | "open"           pill ↔ header+body
//   data-descriptions  "hidden" | "visible"        compact ↔ power-scan card density
//   data-open-id       "<idiom-id>" | ""           which inspector row is expanded
//
// Click flow:
//   - Click card → toggle inspector for that card. Only one open at a time.
//   - Single-click is the ONLY way to open the inspector. Hover does nothing.
//   - Double-click → skip inspector and apply directly.
//   - Apply / Replace / per-chip "+" → mutate chipState, flash the chip
//     section, focus the composer. Apply + Replace also auto-collapse the
//     just-opened inspector after ~700ms; per-chip "+" does NOT collapse so
//     the user can keep grabbing chips out of the recipe.
//
// Subscribers:
//   - chipState.subscribe → recompute applied-state, repaint card markers.
//   - engine.on()        → reset open-id, search, group filter; lazy re-render.
//   - lang.on()          → re-render text content while preserving DOM shape.
//
// Subservience to the chip composer:
//   - The "/" search shortcut never steals focus from the composer or any
//     editable element.
//   - Apply hands focus to the composer via focusComposer().
//   - The chip section gets a ".chip-section--just-seeded" outline-flash
//     after every chip-mutation action.

import { getActiveEngine } from '../core/engine.js';
import { t } from '../i18n/messages.js';
import { captureAnatomy } from '../idioms/sandbox.js';
import { explainAnatomy } from '../idioms/explain.js';
import { chipTypes } from '../chips/_registry.js';

// ---------------------------------------------------------------------------
// Public export
// ---------------------------------------------------------------------------

/**
 * Wire the idiom panel to the page.
 *
 * @param {object} args
 * @param {object} args.chipState       — canonical chip-state object
 * @param {() => void} [args.focusComposer] — focus the composer input
 * @param {object} [args.ctx]           — shared ctx (engine on ctx.engine)
 * @param {{get: () => string, on: (cb: Function) => void}} [args.lang]
 */
export function wireIdiomPanel({ chipState, focusComposer, ctx, lang }) {
  const panel = document.getElementById('idiom-panel');
  if (!panel) {
    console.warn('wireIdiomPanel: #idiom-panel not found — panel wiring skipped');
    return;
  }

  // ── DOM refs (the HTML shell carries the closed-state pill; we lazily
  //    inject the rest of the open-state chrome) ──────────────────────────
  const pill       = panel.querySelector('.idiom-panel-pill');
  const pillCount  = panel.querySelector('.idiom-panel-pill-count');
  const body       = panel.querySelector('.idiom-panel-body');

  // The header in the existing HTML has only title + descriptions toggle +
  // close button. We rebuild it on first open to add the search input +
  // group-filter chips per the redesign contract.
  let header      = panel.querySelector('.idiom-panel-header');
  let headerTitle = null;
  let searchInput = null;
  let groupFilter = null;
  let descToggle  = null;
  let closeBtn    = null;

  if (!pill || !header || !body) {
    console.warn('wireIdiomPanel: required child elements missing — panel wiring skipped');
    return;
  }

  // Drop the stale preview band the previous implementation injected.
  const stalePreview = panel.querySelector('.idiom-panel-preview');
  if (stalePreview) stalePreview.remove();

  // ── Module-local state ────────────────────────────────────────────────
  let bodyRendered          = false;
  let lastRenderedEngineId  = null;
  let lastRenderedLang      = null;
  let searchQuery           = '';
  /** @type {Set<string>} groups currently enabled. Empty = all enabled. */
  const enabledGroups       = new Set();
  /** @type {Map<string, HTMLElement>} idiomId → card element */
  const cardEls             = new Map();
  /** @type {Map<string, HTMLElement>} idiomId → inspector wrapper element */
  const inspectorEls        = new Map();
  /** @type {Map<string, HTMLElement>} groupSlug → section header element */
  const sectionEls          = new Map();
  /** @type {Map<string, HTMLElement>} groupSlug → grid element */
  const gridEls             = new Map();
  /** @type {HTMLElement|null} the empty-state element, if rendered */
  let emptyEl               = null;

  function pickLocalized(v) {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    const cur = lang ? lang.get() : 'ja';
    return v[cur] != null ? v[cur] : (v.ja != null ? v.ja : '');
  }

  function isOpen() {
    return panel.dataset.state === 'open';
  }

  function getIdioms() {
    const eng = getActiveEngine();
    return {
      engine: eng,
      items:  eng.idioms || eng.templates || [],
      order:  eng.idiomGroupOrder || [],
      labels: eng.idiomGroupLabels || {},
    };
  }

  function updatePillCount() {
    if (!pillCount) return;
    const { items } = getIdioms();
    pillCount.textContent = t('idiom.pillCount', { n: items.length });
  }

  // ───────────────────────────────────────────────────────────────────────
  // HEADER (rebuilt on first open with search + group filter)
  // ───────────────────────────────────────────────────────────────────────

  function ensureHeader() {
    if (headerTitle) return; // already built

    // Wipe any markup the original HTML shell shipped — we control it now.
    header.innerHTML = '';
    header.classList.add('idiom-panel-header--rebuilt');

    // Top row — title on the leading edge, close on the trailing edge.
    // Wrapped in a sub-container so they always sit on the same line,
    // independent of the controls row's flex-wrap behavior on mobile.
    const topRow = document.createElement('div');
    topRow.className = 'idiom-panel-header-top';

    // Title doubles as a collapse affordance — clicking the 📚 icon or the
    // title text collapses the panel, mirroring the × button on the trailing
    // edge so the whole top row is a usable dismiss target.
    headerTitle = document.createElement('button');
    headerTitle.type = 'button';
    headerTitle.className = 'idiom-panel-header-title';
    headerTitle.addEventListener('click', closePanel);
    topRow.appendChild(headerTitle);

    closeBtn = document.createElement('button');
    closeBtn.className = 'idiom-panel-close';
    closeBtn.type = 'button';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', closePanel);
    topRow.appendChild(closeBtn);

    header.appendChild(topRow);

    // Controls row — search, group filters, descriptions toggle. Wraps freely.
    const controlsRow = document.createElement('div');
    controlsRow.className = 'idiom-panel-header-controls';

    searchInput = document.createElement('input');
    searchInput.className = 'idiom-panel-search';
    searchInput.type = 'search';
    searchInput.autocomplete = 'off';
    searchInput.spellcheck = false;
    searchInput.addEventListener('input', () => {
      searchQuery = (searchInput.value || '').trim();
      applyFilter();
    });
    controlsRow.appendChild(searchInput);

    groupFilter = document.createElement('div');
    groupFilter.className = 'idiom-panel-group-filter';
    groupFilter.setAttribute('role', 'group');
    controlsRow.appendChild(groupFilter);

    descToggle = document.createElement('button');
    descToggle.className = 'idiom-panel-descriptions-toggle';
    descToggle.type = 'button';
    descToggle.setAttribute('aria-pressed', 'false');
    descToggle.addEventListener('click', () => {
      const nowVisible = panel.dataset.descriptions !== 'visible';
      setDescriptions(nowVisible);
    });
    controlsRow.appendChild(descToggle);

    header.appendChild(controlsRow);
  }

  function refreshHeaderText() {
    if (!headerTitle) return;
    headerTitle.textContent = '📚 ' + t('idiom.pillTitle');
    if (searchInput) {
      searchInput.placeholder = t('idiom.search.placeholder');
      searchInput.setAttribute('aria-label', t('idiom.search.placeholder'));
    }
    if (groupFilter) groupFilter.setAttribute('aria-label', t('idiom.groupFilter.label'));
    if (descToggle) {
      const isOn = panel.dataset.descriptions === 'visible';
      descToggle.textContent = isOn ? t('idiom.toggleHide') : t('idiom.toggleShow');
    }
    if (closeBtn) {
      const closeAria = (lang && lang.get() === 'en') ? 'Close playbook' : '閉じる';
      closeBtn.setAttribute('aria-label', closeAria);
      closeBtn.title = closeAria;
    }
  }

  function setDescriptions(visible) {
    panel.dataset.descriptions = visible ? 'visible' : 'hidden';
    if (descToggle) {
      descToggle.setAttribute('aria-pressed', visible ? 'true' : 'false');
      descToggle.textContent = visible ? t('idiom.toggleHide') : t('idiom.toggleShow');
    }
  }

  function renderGroupFilter() {
    if (!groupFilter) return;
    groupFilter.innerHTML = '';
    const { order, labels } = getIdioms();

    // "All" reset chip — clears any partial selection
    const allChip = document.createElement('button');
    allChip.type = 'button';
    allChip.className = 'idiom-panel-group-chip idiom-panel-group-chip--all';
    allChip.dataset.group = '__all__';
    allChip.textContent = t('idiom.groupFilter.all');
    allChip.setAttribute('aria-pressed', enabledGroups.size === 0 ? 'true' : 'false');
    allChip.addEventListener('click', () => {
      enabledGroups.clear();
      syncGroupFilterPressed();
      applyFilter();
    });
    groupFilter.appendChild(allChip);

    for (const slug of order) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'idiom-panel-group-chip';
      chip.dataset.group = slug;
      chip.textContent = pickLocalized(labels[slug]) || slug;
      chip.setAttribute(
        'aria-pressed',
        (enabledGroups.size === 0 || enabledGroups.has(slug)) ? 'true' : 'false',
      );
      chip.addEventListener('click', () => {
        if (enabledGroups.has(slug)) {
          enabledGroups.delete(slug);
        } else {
          enabledGroups.add(slug);
        }
        syncGroupFilterPressed();
        applyFilter();
      });
      groupFilter.appendChild(chip);
    }
  }

  function syncGroupFilterPressed() {
    if (!groupFilter) return;
    const allChip = groupFilter.querySelector('.idiom-panel-group-chip--all');
    if (allChip) {
      allChip.setAttribute('aria-pressed', enabledGroups.size === 0 ? 'true' : 'false');
    }
    groupFilter.querySelectorAll('.idiom-panel-group-chip:not(.idiom-panel-group-chip--all)').forEach(el => {
      const slug = el.dataset.group;
      el.setAttribute(
        'aria-pressed',
        (enabledGroups.size === 0 || enabledGroups.has(slug)) ? 'true' : 'false',
      );
    });
  }

  // ───────────────────────────────────────────────────────────────────────
  // BODY render
  // ───────────────────────────────────────────────────────────────────────

  function renderBody() {
    const { engine, items, order, labels } = getIdioms();
    lastRenderedEngineId = engine.id;
    lastRenderedLang     = lang ? lang.get() : 'ja';

    body.innerHTML = '';
    cardEls.clear();
    inspectorEls.clear();
    sectionEls.clear();
    gridEls.clear();
    emptyEl = null;

    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'idiom-panel-empty';
      empty.textContent = t('idiom.empty');
      body.appendChild(empty);
      bodyRendered = true;
      return;
    }

    // Group items.  Order = engine's GROUP_ORDER; orphans (group not in
    // GROUP_ORDER) appended at the end into a synthetic "_other" group so
    // we don't drop them silently.
    const groups = new Map(); // slug → array of idioms
    for (const slug of order) groups.set(slug, []);
    for (const idiom of items) {
      const slug = idiom.group && groups.has(idiom.group) ? idiom.group : '_other';
      if (!groups.has(slug)) groups.set(slug, []);
      groups.get(slug).push(idiom);
    }

    for (const [slug, list] of groups) {
      if (!list.length) continue;
      const sectionH = document.createElement('h4');
      sectionH.className = 'idiom-panel-section';
      sectionH.dataset.group = slug;
      sectionH.textContent = pickLocalized(labels[slug]) || (slug === '_other' ? '' : slug);
      body.appendChild(sectionH);
      sectionEls.set(slug, sectionH);

      const grid = document.createElement('div');
      grid.className = 'idiom-panel-grid';
      grid.dataset.group = slug;
      grid.setAttribute('role', 'list');

      for (const idiom of list) {
        const card = buildCard(idiom);
        grid.appendChild(card);
        cardEls.set(idiom.id, card);

        const inspector = buildInspectorShell(idiom);
        grid.appendChild(inspector);
        inspectorEls.set(idiom.id, inspector);
      }
      body.appendChild(grid);
      gridEls.set(slug, grid);
    }

    bodyRendered = true;
    // Populate applied-state markers from current chips.
    repaintAppliedState(chipState.getAll());
  }

  function buildCard(idiom) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'idiom-panel-card';
    card.setAttribute('role', 'listitem');
    card.dataset.idiomId = idiom.id || '';
    card.dataset.applied = 'false';
    card.setAttribute('aria-expanded', 'false');
    const localTitle = pickLocalized(idiom.title);
    const localDesc  = pickLocalized(idiom.description);
    card.setAttribute('aria-label', localTitle + (localDesc ? ' — ' + localDesc : ''));

    // Children — DOM nodes (escapeHtml-free, safer than innerHTML).
    const icon = document.createElement('span');
    icon.className = 'idiom-panel-card-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = idiom.icon || '';
    card.appendChild(icon);

    const title = document.createElement('span');
    title.className = 'idiom-panel-card-title';
    title.textContent = localTitle;
    card.appendChild(title);

    const pattern = document.createElement('span');
    pattern.className = 'idiom-panel-card-pattern';
    pattern.dir = 'ltr';
    pattern.textContent = idiom.pattern || '';
    card.appendChild(pattern);

    const desc = document.createElement('span');
    desc.className = 'idiom-panel-card-desc';
    desc.textContent = localDesc;
    card.appendChild(desc);

    const applied = document.createElement('span');
    applied.className = 'idiom-panel-card-applied';
    applied.setAttribute('aria-hidden', 'true');
    applied.textContent = '✓ ' + t('idiom.applied');
    card.appendChild(applied);

    // Click → toggle inspector
    card.addEventListener('click', (e) => {
      // Avoid double-firing alongside dblclick: dblclick handler will run a
      // direct apply path. Here we just toggle.
      e.preventDefault();
      toggleInspector(idiom.id);
    });

    // Double-click → direct apply
    card.addEventListener('dblclick', (e) => {
      e.preventDefault();
      applyRecipeDirect(idiom);
    });

    return card;
  }

  function buildInspectorShell(idiom) {
    const insp = document.createElement('div');
    insp.className = 'idiom-panel-inspector';
    insp.dataset.for = idiom.id;
    insp.setAttribute('role', 'region');
    insp.hidden = true; // CSS reads [hidden] for visibility
    return insp;
  }

  // ───────────────────────────────────────────────────────────────────────
  // Inspector population (lazy, on first open per idiom)
  // ───────────────────────────────────────────────────────────────────────

  /** @type {Set<string>} idiomIds whose inspector body has been built. */
  const inspectorBuilt = new Set();

  function populateInspector(idiom) {
    const insp = inspectorEls.get(idiom.id);
    if (!insp) return;
    insp.innerHTML = '';

    const { engine } = getIdioms();
    const captured = captureAnatomy(idiom);
    const steps    = explainAnatomy(captured, engine);

    // Title
    const h5 = document.createElement('h5');
    h5.className = 'idiom-inspector-title';
    h5.textContent = (idiom.icon ? idiom.icon + ' ' : '') + pickLocalized(idiom.title);
    insp.appendChild(h5);

    // What it does
    const localDesc = pickLocalized(idiom.description);
    if (localDesc) {
      const h6what = document.createElement('h6');
      h6what.className = 'idiom-inspector-section';
      h6what.textContent = t('idiom.section.whatItDoes');
      insp.appendChild(h6what);
      const p = document.createElement('p');
      p.className = 'idiom-inspector-desc';
      p.textContent = localDesc;
      insp.appendChild(p);
    }

    // Anatomy section
    if (captured && captured.length) {
      const h6anat = document.createElement('h6');
      h6anat.className = 'idiom-inspector-section';
      h6anat.textContent = t('idiom.section.anatomy');
      insp.appendChild(h6anat);

      const anatomyWrap = document.createElement('div');
      anatomyWrap.className = 'idiom-inspector-anatomy';
      for (const chip of captured) {
        const row = renderAnatomyRow(chip, idiom);
        if (row) anatomyWrap.appendChild(row);
      }
      insp.appendChild(anatomyWrap);
    } else {
      const note = document.createElement('p');
      note.className = 'idiom-inspector-desc idiom-inspector-unavailable';
      note.textContent = t('idiom.anatomy.unavailable');
      insp.appendChild(note);
    }

    // Build it manually
    if (steps && steps.length) {
      const h6how = document.createElement('h6');
      h6how.className = 'idiom-inspector-section';
      h6how.textContent = t('idiom.section.howto');
      insp.appendChild(h6how);
      // One-line convention note: explain that the «...» markers around
      // example text in the steps below are visual delimiters, not
      // characters the user types.
      const note = document.createElement('p');
      note.className = 'idiom-inspector-note';
      note.textContent = t('idiom.howto.note');
      insp.appendChild(note);
      const ol = document.createElement('ol');
      ol.className = 'idiom-inspector-howto';
      for (const step of steps) ol.appendChild(renderHowtoLi(step));
      insp.appendChild(ol);
    }

    // Pattern strip
    if (idiom.pattern) {
      const h6asm = document.createElement('h6');
      h6asm.className = 'idiom-inspector-section';
      h6asm.textContent = t('idiom.section.assembled');
      insp.appendChild(h6asm);
      const code = document.createElement('code');
      code.className = 'idiom-inspector-pattern';
      code.dir = 'ltr';
      code.textContent = idiom.pattern;
      insp.appendChild(code);
    }

    // Action row
    const actions = document.createElement('div');
    actions.className = 'idiom-inspector-actions';

    const applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.className = 'idiom-inspector-apply';
    refreshApplyButtonLabel(applyBtn, idiom);
    applyBtn.addEventListener('click', () => applyRecipe(idiom, /* replace */ false));
    actions.appendChild(applyBtn);

    const replaceBtn = document.createElement('button');
    replaceBtn.type = 'button';
    replaceBtn.className = 'idiom-inspector-replace';
    replaceBtn.textContent = '⟲ ' + t('idiom.replaceRecipe');
    replaceBtn.addEventListener('click', () => applyRecipe(idiom, /* replace */ true));
    actions.appendChild(replaceBtn);

    insp.appendChild(actions);

    inspectorBuilt.add(idiom.id);
  }

  function refreshApplyButtonLabel(btn, idiom) {
    const card = cardEls.get(idiom.id);
    const isApplied = card && card.dataset.applied === 'true';
    btn.textContent = '✚ ' + (isApplied ? t('idiom.reapply') : t('idiom.applyRecipe'));
  }

  /**
   * Render a single anatomy chip + its trailing "+ this chip" button.
   * Uses the live per-chip render functions with no-op handlers and wraps
   * the result in `chip--readonly`. CSS hides interactive sub-elements.
   */
  function renderAnatomyRow(capturedChip, idiom) {
    const renderer = chipTypes[capturedChip.type];
    if (!renderer || typeof renderer.render !== 'function') return null;

    const row = document.createElement('div');
    row.className = 'idiom-inspector-anatomy-row';

    // No-op handlers — chips render their full visual including operator
    // dropdowns / quote toggles etc. (CSS hides interactive bits via
    // .chip--readonly selectors). Listeners inside the chip will still fire
    // on click but their handlers are no-ops; the wrapper class also sets
    // pointer-events: none, so events don't actually originate here.
    const noopHandlers = {
      onDelete:        () => {},
      onChangeText:    () => {},
      onChangeProps:   () => {},
      onChangeOperator:() => {},
      onToggleNegate:  () => {},
      onToggleQuoted:  () => {},
      onAddOrBranch:   undefined, // omitted so OR handle isn't rendered
      onFocus:         () => {},
      onMove:          () => {},
      onSelect:        () => {},
      onAddOr:         () => {},
    };

    let chipEl;
    try {
      chipEl = renderer.render(
        { id: capturedChip.id, type: capturedChip.type, props: { ...capturedChip.props } },
        noopHandlers,
      );
    } catch (e) {
      console.warn('[idiom-panel] chip render threw for', capturedChip.type, e);
      return null;
    }
    if (!chipEl || !(chipEl instanceof HTMLElement)) return null;
    chipEl.classList.add('chip--readonly');

    // OR connector / scaffold chips don't need a "+" button — they're
    // structural, only meaningful between two terms. Skip the add button
    // to keep the anatomy list clean.
    row.appendChild(chipEl);
    if (capturedChip.type !== 'or-connector') {
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'idiom-inspector-add-one';
      addBtn.setAttribute('aria-label', t('idiom.addThisChip'));
      addBtn.title = t('idiom.addThisChip');
      addBtn.textContent = '+';
      addBtn.addEventListener('click', () => addOneChip(capturedChip, idiom));
      row.appendChild(addBtn);
    }
    return row;
  }

  /**
   * Render a single "Build it manually" step as an <li>. The resolved
   * string contains [[...]] markers which get wrapped in pill spans.
   *
   * Step.vars may carry nested label keys (opLabelKey, itemLabelKey) that
   * the renderer must resolve to localized strings before passing to t().
   */
  function renderHowtoLi(step) {
    const li = document.createElement('li');

    // Resolve nested label keys first so the i18n function form has the
    // already-localized human-readable label to interpolate.
    const vars = { ...step.vars };
    if (vars.opLabelKey) {
      vars.opLabel = t(vars.opLabelKey);
    }
    if (vars.itemLabelKey) {
      vars.itemLabel = t(vars.itemLabelKey);
    }

    // Resolve the step's main string.
    let text;
    try {
      text = t(step.key, vars);
    } catch (e) {
      console.warn('[idiom-panel] howto step lookup failed', step.key, e);
      text = step.key;
    }
    if (typeof text !== 'string') text = String(text);

    // Split on [[...]] markers and wrap matches in mini-pill spans.
    const parts = text.split(/(\[\[[^\]]+\]\])/);
    for (const part of parts) {
      if (!part) continue;
      const m = /^\[\[([^\]]+)\]\]$/.exec(part);
      if (m) {
        const span = document.createElement('span');
        span.className = 'idiom-control-mention';
        span.textContent = m[1];
        li.appendChild(span);
      } else {
        li.appendChild(document.createTextNode(part));
      }
    }
    return li;
  }

  // ───────────────────────────────────────────────────────────────────────
  // Inspector open/close + filter
  // ───────────────────────────────────────────────────────────────────────

  function setOpenInspector(id) {
    const prev = panel.dataset.openId || '';
    if (prev === id) return; // no-op

    if (prev) {
      const prevInsp = inspectorEls.get(prev);
      const prevCard = cardEls.get(prev);
      if (prevInsp) prevInsp.hidden = true;
      if (prevCard) prevCard.setAttribute('aria-expanded', 'false');
    }

    panel.dataset.openId = id || '';

    if (id) {
      const card = cardEls.get(id);
      const insp = inspectorEls.get(id);
      if (card) card.setAttribute('aria-expanded', 'true');
      if (insp) {
        // Lazy-build the inspector body the first time it's opened.
        const idiom = getIdioms().items.find(i => i.id === id);
        if (idiom && !inspectorBuilt.has(id)) populateInspector(idiom);
        insp.hidden = false;
        // Smooth-scroll into view, respecting reduced-motion.
        const reducedMotion = window.matchMedia &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        try {
          insp.scrollIntoView({
            block: 'nearest',
            behavior: reducedMotion ? 'auto' : 'smooth',
          });
        } catch { /* older browsers */ }
      }
    }
  }

  function toggleInspector(id) {
    if (panel.dataset.openId === id) {
      setOpenInspector('');
    } else {
      setOpenInspector(id);
    }
  }

  /**
   * Apply a recipe's `apply()` to the chip state, fire the chip-section
   * bridge flash, focus the composer, and (after ~700ms) auto-collapse the
   * inspector that ran.
   */
  function applyRecipe(idiom, replace) {
    if (!idiom || typeof idiom.apply !== 'function') return;
    try {
      if (replace && typeof chipState.clear === 'function') chipState.clear();
      idiom.apply(chipState);
    } catch (e) {
      console.warn('[idiom-panel] apply() failed for', idiom.id, e);
      return;
    }
    flashChipSection();
    if (typeof focusComposer === 'function') setTimeout(focusComposer, 100);

    // Auto-collapse after the animation resolves (700ms) so the user's
    // attention follows the chips down rather than back to the panel.
    if (panel.dataset.openId === idiom.id) {
      setTimeout(() => {
        if (panel.dataset.openId === idiom.id) setOpenInspector('');
      }, 700);
    }
  }

  /** Direct apply (double-click) — same as Apply but always closes the inspector immediately. */
  function applyRecipeDirect(idiom) {
    if (!idiom || typeof idiom.apply !== 'function') return;
    try {
      idiom.apply(chipState);
    } catch (e) {
      console.warn('[idiom-panel] apply() failed for', idiom.id, e);
      return;
    }
    flashChipSection();
    if (typeof focusComposer === 'function') setTimeout(focusComposer, 100);
    if (panel.dataset.openId) setOpenInspector('');
  }

  /** Per-anatomy-chip "+" — adds a single captured chip to the workspace. */
  function addOneChip(capturedChip, _idiom) {
    if (!chipState || typeof chipState.add !== 'function') return;
    try {
      chipState.add(capturedChip.type, { ...capturedChip.props });
    } catch (e) {
      console.warn('[idiom-panel] addOneChip failed', capturedChip.type, e);
      return;
    }
    flashChipSection();
    if (typeof focusComposer === 'function') setTimeout(focusComposer, 100);
    // Do NOT auto-collapse — user is still browsing this recipe.
  }

  function flashChipSection() {
    const chipSection =
      document.querySelector('.chip-section') ||
      document.querySelector('#chip-area')?.closest('section');
    if (chipSection) {
      chipSection.classList.add('chip-section--just-seeded');
      setTimeout(() => chipSection.classList.remove('chip-section--just-seeded'), 450);
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // Search + group filter
  // ───────────────────────────────────────────────────────────────────────

  function applyFilter() {
    if (!bodyRendered) return;
    const { items, order } = getIdioms();
    const q = searchQuery.toLowerCase();
    const cur = lang ? lang.get() : 'ja';
    const otherCur = cur === 'ja' ? 'en' : 'ja';

    // Per-card visibility
    const visibleByGroup = new Map(); // slug → count visible
    let totalVisible = 0;

    for (const idiom of items) {
      const card = cardEls.get(idiom.id);
      if (!card) continue;
      const slug = idiom.group || '_other';

      // Group-filter check
      const groupAllowed = enabledGroups.size === 0 || enabledGroups.has(slug);

      // Search check (cross-script: try active lang first, fall back to other)
      let matches = true;
      if (q) {
        const titles = [
          pickLocalized(idiom.title),
          (idiom.title && typeof idiom.title === 'object') ? (idiom.title[otherCur] || '') : '',
        ].filter(Boolean);
        const descs = [
          pickLocalized(idiom.description),
          (idiom.description && typeof idiom.description === 'object') ? (idiom.description[otherCur] || '') : '',
        ].filter(Boolean);
        const haystack = [
          ...titles,
          ...descs,
          idiom.pattern || '',
        ].join(' ').toLowerCase();
        matches = haystack.includes(q);
      }

      const visible = groupAllowed && matches;
      card.hidden = !visible;
      // Hide its inspector too if the card is hidden
      const insp = inspectorEls.get(idiom.id);
      if (insp && !visible && panel.dataset.openId === idiom.id) {
        setOpenInspector(''); // close it as it's now off-screen
      }

      if (visible) {
        totalVisible++;
        visibleByGroup.set(slug, (visibleByGroup.get(slug) || 0) + 1);
      }
    }

    // Section header visibility
    for (const slug of [...order, '_other']) {
      const sec = sectionEls.get(slug);
      const grid = gridEls.get(slug);
      const count = visibleByGroup.get(slug) || 0;
      if (sec) sec.hidden = count === 0;
      if (grid) grid.hidden = count === 0;
    }

    // Empty-state message
    if (emptyEl) { emptyEl.remove(); emptyEl = null; }
    if (totalVisible === 0 && q) {
      emptyEl = document.createElement('p');
      emptyEl.className = 'idiom-panel-empty';
      emptyEl.textContent = t('idiom.search.noResults', { q: searchQuery });
      body.appendChild(emptyEl);
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // Applied-state subscriber
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Multiset subset matching on (type, operator, negate, quoted, text).
   * Empty placeholder chips (text === '') are ignored, so a recipe full of
   * blank "fill in the term" scaffolds doesn't show ✓ on an empty workspace.
   */
  function isApplied(idiom, currentChips) {
    const captured = captureAnatomy(idiom);
    if (!captured) return false;
    const sig = captured.filter(c => {
      if (c.type === 'or-connector') return false;
      if (c.type === 'keyword' && !((c.props.text || '').trim())) return false;
      return true;
    });
    if (!sig.length) return false;
    return sig.every(s => currentChips.some(cc => chipMatches(cc, s)));
  }

  function chipMatches(cc, sig) {
    if (cc.type !== sig.type) return false;
    const a = cc.props || {};
    const b = sig.props || {};
    switch (sig.type) {
      case 'keyword':
        return (a.operator || 'none') === (b.operator || 'none')
          && !!a.negate === !!b.negate
          && !!a.quoted === !!b.quoted
          && (a.text || '').trim() === (b.text || '').trim();
      case 'filetype':
        return (a.value || '') === (b.value || '');
      case 'date-range':
        return (a.after || '') === (b.after || '')
          && (a.before || '') === (b.before || '');
      case 'filter':
        return (a.value || '') === (b.value || '')
          && !!a.negate === !!b.negate;
      case 'engagement':
        return (a.metric || '') === (b.metric || '')
          && (a.direction || 'min') === (b.direction || 'min')
          && String(a.value ?? '') === String(b.value ?? '');
      case 'proximity':
        return (a.term1 || '') === (b.term1 || '')
          && (a.term2 || '') === (b.term2 || '')
          && Number(a.distance ?? 5) === Number(b.distance ?? 5);
      case 'number-range':
        return (a.low ?? '') === (b.low ?? '')
          && (a.high ?? '') === (b.high ?? '')
          && (a.prefix || '') === (b.prefix || '');
      default:
        return false;
    }
  }

  function repaintAppliedState(currentChips) {
    if (!bodyRendered) return;
    const { items } = getIdioms();
    for (const idiom of items) {
      const card = cardEls.get(idiom.id);
      if (!card) continue;
      const wasApplied = card.dataset.applied === 'true';
      const nowApplied = isApplied(idiom, currentChips);
      card.dataset.applied = nowApplied ? 'true' : 'false';
      // If the inspector is currently open for this card, refresh the apply
      // button label as it depends on applied state.
      if (wasApplied !== nowApplied && panel.dataset.openId === idiom.id) {
        const insp = inspectorEls.get(idiom.id);
        const btn  = insp && insp.querySelector('.idiom-inspector-apply');
        if (btn) refreshApplyButtonLabel(btn, idiom);
      }
      // Also refresh the visible "✓ Applied" badge text in the active lang.
      const badge = card.querySelector('.idiom-panel-card-applied');
      if (badge) badge.textContent = '✓ ' + t('idiom.applied');
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // Open / close panel
  // ───────────────────────────────────────────────────────────────────────

  function openPanel() {
    ensureHeader();
    refreshHeaderText();
    setDescriptions(panel.dataset.descriptions === 'visible');

    const eng = getActiveEngine();
    const curLang = lang ? lang.get() : 'ja';
    if (!bodyRendered || lastRenderedEngineId !== eng.id || lastRenderedLang !== curLang) {
      renderBody();
      // Group filter depends on engine.idiomGroupOrder, so render after body.
      renderGroupFilter();
      applyFilter();
    }

    panel.dataset.state = 'open';
    pill.hidden = true;
    pill.setAttribute('aria-expanded', 'true');
    header.hidden = false;
    body.hidden = false;
  }

  function closePanel() {
    panel.dataset.state = 'closed';
    setOpenInspector('');
    pill.hidden = false;
    pill.setAttribute('aria-expanded', 'false');
    header.hidden = true;
    body.hidden = true;
    // Return focus to the pill so keyboard users have a sensible landing spot.
    try { pill.focus({ preventScroll: true }); } catch { /* no-op */ }
  }

  // ───────────────────────────────────────────────────────────────────────
  // Wiring
  // ───────────────────────────────────────────────────────────────────────

  pill.addEventListener('click', openPanel);

  // Esc priority: inspector → search → close panel.
  panel.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) {
      if (panel.dataset.openId) {
        e.stopPropagation();
        setOpenInspector('');
        return;
      }
      if (searchInput && searchInput.value) {
        e.stopPropagation();
        searchInput.value = '';
        searchQuery = '';
        applyFilter();
        searchInput.focus();
        return;
      }
      e.stopPropagation();
      closePanel();
    }
  });

  // Card keyboard nav: Enter, ↑/↓
  body.addEventListener('keydown', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const card = target.closest('.idiom-panel-card');
    if (!card) return;
    const id = card.dataset.idiomId;

    if (e.key === 'Enter') {
      e.preventDefault();
      if (panel.dataset.openId === id) {
        // Already open: focus + click Apply
        const insp = inspectorEls.get(id);
        const btn  = insp && insp.querySelector('.idiom-inspector-apply');
        if (btn) btn.click();
      } else {
        const idiom = getIdioms().items.find(i => i.id === id);
        if (!idiom) return;
        setOpenInspector(id);
        // Focus the apply button after the inspector renders
        requestAnimationFrame(() => {
          const insp = inspectorEls.get(id);
          const btn  = insp && insp.querySelector('.idiom-inspector-apply');
          if (btn) try { btn.focus(); } catch {}
        });
      }
      return;
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      // Skip inspectors — only navigate between cards.
      const cards = Array.from(body.querySelectorAll('.idiom-panel-card:not([hidden])'));
      const idx = cards.indexOf(card);
      if (idx < 0) return;
      const nextIdx = e.key === 'ArrowDown' ? idx + 1 : idx - 1;
      if (nextIdx < 0 || nextIdx >= cards.length) return;
      e.preventDefault();
      try { cards[nextIdx].focus(); } catch {}
    }
  });

  // "/" focuses the search input — but only when the panel is open AND
  // focus is not already in an editable context (composer, chip text, etc.).
  document.addEventListener('keydown', (e) => {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (!isOpen()) return;
    const ae = document.activeElement;
    if (isEditableTarget(ae)) return;
    if (!searchInput) return;
    e.preventDefault();
    try { searchInput.focus(); } catch {}
  });

  function isEditableTarget(el) {
    if (!el || !(el instanceof HTMLElement)) return false;
    const tag = el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    if (el.isContentEditable) return true;
    return false;
  }

  // ── chipState subscription (applied-state) ────────────────────────────
  if (chipState && typeof chipState.subscribe === 'function') {
    chipState.subscribe((snapshot) => {
      if (!bodyRendered) return;
      repaintAppliedState(snapshot);
    });
  }

  // ── engine swap ────────────────────────────────────────────────────────
  let engineController = null;
  if (ctx && ctx.engine && typeof ctx.engine.on === 'function') {
    engineController = ctx.engine;
  }
  if (engineController) {
    engineController.on(() => {
      // Reset to initial state for the new engine.
      panel.dataset.state = 'closed';
      panel.dataset.openId = '';
      panel.dataset.descriptions = 'hidden';
      setOpenInspector('');
      searchQuery = '';
      enabledGroups.clear();
      if (searchInput) searchInput.value = '';
      bodyRendered = false;
      inspectorBuilt.clear();
      pill.hidden = false;
      pill.setAttribute('aria-expanded', 'false');
      header.hidden = true;
      body.hidden = true;
      updatePillCount();
    });
  } else {
    console.warn(
      'wireIdiomPanel: no ctx.engine.on() found — panel will NOT auto-refresh on engine swap. ' +
      'Pass the engine controller on ctx.engine or call wireIdiomPanel after createEngineController.',
    );
  }

  // ── language swap ──────────────────────────────────────────────────────
  if (lang && typeof lang.on === 'function') {
    lang.on(() => {
      updatePillCount();
      if (!bodyRendered) return;
      // Re-render the body in the new language (keeps the same DOM contract).
      const wasOpen = panel.dataset.openId;
      inspectorBuilt.clear();
      renderBody();
      renderGroupFilter();
      refreshHeaderText();
      applyFilter();
      // Restore the previously-open inspector if it still exists.
      if (wasOpen && cardEls.has(wasOpen)) {
        panel.dataset.openId = ''; // force re-open path so focus is correct
        setOpenInspector(wasOpen);
      }
    });
  }

  // ───────────────────────────────────────────────────────────────────────
  // Initial setup
  // ───────────────────────────────────────────────────────────────────────

  // Make sure the closed-state attributes are set; the HTML shell defaults
  // to data-state="closed" / data-descriptions="hidden" but ensure here.
  if (!panel.dataset.state) panel.dataset.state = 'closed';
  if (!panel.dataset.descriptions) panel.dataset.descriptions = 'hidden';
  panel.dataset.openId = '';
  pill.hidden = false;
  pill.setAttribute('aria-expanded', 'false');
  header.hidden = true;
  body.hidden = true;
  updatePillCount();
}
