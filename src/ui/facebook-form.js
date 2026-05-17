import { t } from '../i18n/messages.js';
import { getActiveLang } from '../core/lang.js';
import { createArabicDateInput } from './arabic-calendar.js';

// Facebook search form — the entire input UI when the Facebook engine is
// active. Replaces the chip composer + chip area + drawer surface.
//
// State:
//   {
//     category: 'top' | 'posts' | 'people' | 'photos' | 'videos' | 'pages',
//     keyword:  string,
//     sections: { [sectionId]: { optionId: string } },
//     toggles:  { [sectionId]: boolean },
//     date:     null | { startYear, startMonth, startDay, endYear, endMonth, endDay },
//   }

const CATEGORY_LABELS_BY_ID = {};

/**
 * @param {object} args
 * @param {HTMLElement} args.host
 * @param {object} args.engine
 * @param {{ requestUpdate: () => void }} args.ctx
 * @returns {{ getState: () => object, reset: () => void, refresh: () => void }}
 */
export function wireFacebookForm({ host, explainerHost, engine, ctx, lang }) {
  host.classList.add('fb-form');
  host.setAttribute('aria-label', t('ui.fbForm.ariaLabel'));

  const state = makeInitialState();

  function set(patch) {
    Object.assign(state, patch);
    ctx.requestUpdate();
  }

  function setSection(sectionId, optionId) {
    state.sections = { ...state.sections, [sectionId]: { optionId } };
    ctx.requestUpdate();
  }
  function setToggle(sectionId, on) {
    state.toggles = { ...state.toggles, [sectionId]: !!on };
    ctx.requestUpdate();
  }
  function setDate(patch) {
    state.date = { ...(state.date || makeEmptyDate()), ...patch };
    ctx.requestUpdate();
  }
  function clearDate() {
    state.date = null;
    ctx.requestUpdate();
  }

  function reset() {
    const fresh = makeInitialState();
    Object.keys(state).forEach(k => delete state[k]);
    Object.assign(state, fresh);
    render();
    ctx.requestUpdate();
  }

  // ===== DOM helpers =====
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k.startsWith('data-')) node.setAttribute(k, v);
        else if (k === 'dataset' && typeof v === 'object') Object.assign(node.dataset, v);
        else if (k in node) {
          try { node[k] = v; } catch (_) { node.setAttribute(k, v); }
        } else {
          node.setAttribute(k, v);
        }
      }
    }
    if (children) {
      const arr = Array.isArray(children) ? children : [children];
      for (const c of arr) {
        if (c == null || c === false) continue;
        node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      }
    }
    return node;
  }

  // ===== DOM rendering =====
  function render() {
    if (explainerHost) {
      while (explainerHost.firstChild) explainerHost.removeChild(explainerHost.firstChild);
      if (!state.explainerDismissed) explainerHost.appendChild(renderExplainer());
    }
    while (host.firstChild) host.removeChild(host.firstChild);
    host.appendChild(renderCategoryRow());
    host.appendChild(renderKeywordRow());
    host.appendChild(renderSections());
    host.appendChild(renderAttribution());
  }

  function renderExplainer() {
    const dismiss = () => {
      state.explainerDismissed = true;
      wrap.remove();
      ctx.requestUpdate();
    };
    const wrap = el('section', {
      class: 'fb-form-explainer',
      role: 'button',
      tabindex: '0',
      'aria-labelledby': 'fb-explainer-title',
      title: t('ui.fbForm.explainer.dismiss'),
      onclick: dismiss,
      onkeydown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          dismiss();
        }
      },
    });
    const head = el('div', { class: 'fb-form-explainer-head' });
    head.appendChild(el('h3', {
      id: 'fb-explainer-title',
      class: 'fb-form-explainer-title',
      text: t('ui.fbForm.explainer.title'),
    }));
    head.appendChild(el('span', {
      class: 'fb-form-explainer-dismiss',
      'aria-hidden': 'true',
      text: t('ui.fbForm.explainer.dismiss'),
    }));
    wrap.appendChild(head);
    wrap.appendChild(el('p', {
      class: 'fb-form-explainer-intro',
      text: t('ui.fbForm.explainer.intro'),
    }));
    const steps = el('ol', { class: 'fb-form-explainer-steps' });
    ['step1', 'step2', 'step3', 'step4'].forEach(k => {
      steps.appendChild(el('li', { text: t('ui.fbForm.explainer.' + k) }));
    });
    wrap.appendChild(steps);
    return wrap;
  }

  function renderAttribution() {
    return el('p', {
      class: 'fb-form-attribution',
      text: t('ui.fbForm.attribution'),
    });
  }

  function renderCategoryRow() {
    const wrap = el('section', {
      class: 'fb-form-categories',
      'aria-label': t('ui.fbForm.categoryLegend'),
    });
    const grid = el('div', { class: 'fb-cat-grid', role: 'radiogroup' });

    engine.categories.forEach(cat => {
      const isActive = cat.value === state.category;
      const hint = t(cat.hint);
      const btn = el('button', {
        type: 'button',
        class: 'fb-cat-btn' + (isActive ? ' is-active' : ''),
        role: 'radio',
        'aria-checked': isActive ? 'true' : 'false',
        'aria-describedby': 'fb-cat-hint-' + cat.value,
        title: hint,
        dataset: { cat: cat.value, value: cat.value },
        onclick: () => {
          if (state.category === cat.value) return;
          state.category = cat.value;
          // Clear sections/toggles/date when switching category — section
          // lists differ per category and stale state would leak across.
          state.sections = {};
          state.toggles = {};
          state.date = null;
          render();
          ctx.requestUpdate();
        },
      }, [
        el('span', { class: 'fb-cat-label', text: t(cat.label) }),
      ]);
      CATEGORY_LABELS_BY_ID[cat.value] = t(cat.label);
      grid.appendChild(btn);
      grid.appendChild(el('span', { class: 'sr-only', id: 'fb-cat-hint-' + cat.value, text: hint }));
    });

    wrap.appendChild(grid);
    return wrap;
  }

  function renderKeywordRow() {
    const wrap = el('section', { class: 'fb-form-keyword', 'aria-labelledby': 'fb-keyword-legend' });
    wrap.appendChild(el('label', {
      id: 'fb-keyword-legend',
      class: 'fb-form-legend',
      htmlFor: 'fb-keyword-input',
      text: t('ui.fbForm.keywordLegend'),
    }));
    const input = el('input', {
      type: 'text',
      id: 'fb-keyword-input',
      class: 'fb-keyword-input',
      dir: 'auto',
      value: state.keyword || '',
      placeholder: t('ui.fbForm.keywordPlaceholder'),
      autocomplete: 'off',
      spellcheck: false,
      'aria-describedby': 'fb-keyword-hint',
      oninput: (e) => set({ keyword: e.target.value }),
    });
    wrap.appendChild(input);
    wrap.appendChild(el('p', {
      id: 'fb-keyword-hint',
      class: 'fb-form-hint',
      text: t('ui.fbForm.keywordHint'),
    }));
    return wrap;
  }

  function renderSections() {
    const container = el('div', { class: 'fb-form-sections' });
    const sections = (engine.categorySections && engine.categorySections[state.category]) || [];
    if (!sections.length) {
      container.appendChild(el('p', { class: 'fb-form-empty', text: t('ui.fbForm.noFilters') }));
      return container;
    }
    sections.forEach(section => container.appendChild(renderSection(section)));
    return container;
  }

  function renderSection(section) {
    if (section.kind === 'date')   return renderDateSection(section);
    if (section.kind === 'toggle') return renderToggleSection(section);
    return renderRadioSection(section);
  }

  function renderRadioSection(section) {
    const legendId = 'fb-sec-' + section.id + '-legend';
    const wrap = el('section', {
      class: 'fb-form-section',
      role: 'radiogroup',
      'aria-labelledby': legendId,
      dataset: { section: section.id },
    });
    wrap.appendChild(el('h3', { id: legendId, class: 'fb-form-legend', text: t(section.legend) }));

    const sel = state.sections[section.id] || { optionId: 'none' };
    const row = el('div', { class: 'fb-pill-row' });
    const pills = [];

    section.options.forEach(opt => {
      const checked = sel.optionId === opt.id;
      const pill = el('button', {
        type: 'button',
        class: 'fb-pill' + (checked ? ' is-active' : ''),
        role: 'radio',
        'aria-checked': checked ? 'true' : 'false',
        tabindex: checked ? '0' : '-1',
        dataset: { option: opt.id },
        text: t(opt.label),
        onclick: () => {
          setSection(section.id, opt.id);
          // Update aria-checked + tabindex + .is-active across the row in
          // place; no full re-render so focus survives the click.
          pills.forEach(p => {
            const isMe = p === pill;
            p.setAttribute('aria-checked', isMe ? 'true' : 'false');
            p.setAttribute('tabindex', isMe ? '0' : '-1');
            p.classList.toggle('is-active', isMe);
          });
          pill.focus();
        },
      });
      pills.push(pill);
      row.appendChild(pill);
    });

    // Roving-tabindex arrow-key navigation for the radiogroup.
    row.addEventListener('keydown', (e) => {
      if (!pills.length) return;
      const currentIdx = pills.findIndex(p => p === document.activeElement);
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        const start = currentIdx < 0 ? 0 : currentIdx;
        const next = (start + dir + pills.length) % pills.length;
        pills[next].focus();
        pills[next].click();
      } else if (e.key === 'Home') {
        e.preventDefault();
        pills[0].focus();
        pills[0].click();
      } else if (e.key === 'End') {
        e.preventDefault();
        pills[pills.length - 1].focus();
        pills[pills.length - 1].click();
      }
    });

    wrap.appendChild(row);
    return wrap;
  }

  function renderToggleSection(section) {
    const wrap = el('section', {
      class: 'fb-form-section',
      dataset: { section: section.id },
    });
    wrap.appendChild(el('h3', { class: 'fb-form-legend', text: t(section.legend) }));

    const on = !!(state.toggles && state.toggles[section.id]);
    const row = el('div', { class: 'fb-pill-row' });
    const pill = el('button', {
      type: 'button',
      class: 'fb-pill' + (on ? ' is-active' : ''),
      'aria-pressed': on ? 'true' : 'false',
      dataset: { toggle: section.id },
      text: section.toggleLabel ? t(section.toggleLabel) : t('ui.fbForm.toggleDefault'),
      onclick: () => {
        const next = !(state.toggles && state.toggles[section.id]);
        setToggle(section.id, next);
        pill.setAttribute('aria-pressed', next ? 'true' : 'false');
        pill.classList.toggle('is-active', next);
      },
    });
    row.appendChild(pill);
    wrap.appendChild(row);
    return wrap;
  }

  function renderDateSection(section) {
    const wrap = el('section', {
      class: 'fb-form-section fb-form-date',
      dataset: { section: 'datePosted' },
      'aria-describedby': 'fb-sec-datePosted-hint',
    });
    wrap.appendChild(el('h3', { class: 'fb-form-legend', text: t(section.legend) }));

    const row = el('div', { class: 'fb-date-row' });

    function applyStart(v) {
      const parsed = parseDateStr(v);
      if (!parsed) {
        const next = { ...(state.date || {}) };
        delete next.startDay; delete next.startMonth; delete next.startYear;
        if (Object.keys(next).length === 0) clearDate(); else setDate(next);
        return;
      }
      setDate({
        startYear: parsed.year,
        startMonth: parsed.year + '-' + parsed.monthRaw,
        startDay:   parsed.year + '-' + parsed.monthRaw + '-' + parsed.dayRaw,
      });
    }
    function applyEnd(v) {
      const parsed = parseDateStr(v);
      if (!parsed) {
        const next = { ...(state.date || {}) };
        delete next.endDay; delete next.endMonth; delete next.endYear;
        if (Object.keys(next).length === 0) clearDate(); else setDate(next);
        return;
      }
      setDate({
        endYear: parsed.year,
        endMonth: parsed.year + '-' + parsed.monthRaw,
        endDay:   parsed.year + '-' + parsed.monthRaw + '-' + parsed.dayRaw,
      });
    }

    // state.date stores Facebook's preferred un-padded form ('2026-5-15');
    // input widgets need padded ISO ('2026-05-15').
    const startValue = padIsoDate(state.date && state.date.startDay);
    const endValue = padIsoDate(state.date && state.date.endDay);

    let startEl, endEl;
    // JP fork: always use the native HTML5 <input type="date"> picker.
    // The Arabic Hijri-aware calendar widget is dead code in this fork.
    if (false) {
      startEl = createArabicDateInput({ value: startValue, ariaLabel: '', onChange: applyStart }).el;
      endEl   = createArabicDateInput({ value: endValue,   ariaLabel: '', onChange: applyEnd }).el;
    } else {
      startEl = el('input', {
        type: 'date',
        class: 'fb-date-input',
        dir: 'ltr',
        value: startValue,
        oninput: (e) => applyStart(e.target.value),
      });
      endEl = el('input', {
        type: 'date',
        class: 'fb-date-input',
        dir: 'ltr',
        value: endValue,
        oninput: (e) => applyEnd(e.target.value),
      });
    }

    row.appendChild(el('span', { class: 'fb-date-label', text: t('engine.facebook.sec.datePosted.from') }));
    row.appendChild(startEl);
    row.appendChild(el('span', { class: 'fb-date-label', text: t('engine.facebook.sec.datePosted.to') }));
    row.appendChild(endEl);
    wrap.appendChild(row);
    wrap.appendChild(el('span', {
      class: 'sr-only',
      id: 'fb-sec-datePosted-hint',
      text: t('engine.facebook.sec.datePosted.hint'),
    }));
    return wrap;
  }

  render();

  // Re-render whole form on language change so legends, options, hints,
  // placeholders all pick up the new language.
  if (lang && typeof lang.on === 'function') {
    lang.on(() => {
      host.setAttribute('aria-label', t('ui.fbForm.ariaLabel'));
      render();
    });
  }

  function refresh() { render(); }
  return { getState: () => state, reset, refresh };
}

function makeInitialState() {
  return {
    category: 'top',
    keyword: '',
    sections: {},
    toggles: {},
    date: null,
    explainerDismissed: false,
  };
}

function makeEmptyDate() {
  return {};
}

// Parse 'YYYY-MM-DD' as the HTML5 date input emits it; return raw (un-padded)
// month and day strings to match Facebook's preferred form ('2019-1-1').
function parseDateStr(s) {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const year = m[1];
  const monthRaw = String(parseInt(m[2], 10));
  const dayRaw   = String(parseInt(m[3], 10));
  return { year, monthRaw, dayRaw };
}

// Pad un-padded date ('2026-5-15') back to ISO ('2026-05-15') for display.
function padIsoDate(s) {
  if (!s) return '';
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (!m) return '';
  const pad = (x) => x.length < 2 ? '0' + x : x;
  return m[1] + '-' + pad(m[2]) + '-' + pad(m[3]);
}
