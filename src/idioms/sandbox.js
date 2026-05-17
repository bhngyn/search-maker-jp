// Sandboxed idiom anatomy capture.
//
// `captureAnatomy(idiom)` runs an idiom's `apply(chipState)` against a
// mock chipState that records add() / addAfter() calls without notifying
// any real subscriber or touching the DOM. Returns the captured chip array
//   [{ id, type, props }, ...]
// in the order the idiom produced them, with each chip's props merged on
// top of the type's defaultProps() so callers always see a complete object.
//
// Returns `null` on any error so callers degrade gracefully (e.g. falling
// back to rendering the raw `pattern` string from the idiom object).
//
// Results are memoized per idiom.id (plain Map, module-level — no
// persistence, never written to storage). Cache is intentionally never
// cleared because idiom.apply() is deterministic except for date-range
// idioms that use `new Date()`. Date-range idioms will therefore cache the
// first evaluation's dates — which is acceptable for the anatomy view (the
// displayed dates are illustrative, not operative). If live dates are
// required in the future, callers can call captureAnatomy(idiom, { noCache: true }).

import { chipTypes } from '../chips/_registry.js';

/** @type {Map<string, Array<{id:string,type:string,props:object}>|null>} */
const _cache = new Map();

/**
 * Build a chip's default props by merging the type's defaultProps() with
 * the caller-supplied patch. Unknown types fall back to the patch alone.
 *
 * @param {string} type
 * @param {object} patch
 * @returns {object}
 */
function mergedProps(type, patch) {
  const mod = chipTypes[type];
  const defaults = (mod && typeof mod.defaultProps === 'function')
    ? mod.defaultProps()
    : {};
  return { ...defaults, ...patch };
}

/**
 * Run `idiom.apply()` against a mock chipState that records calls without
 * side-effects. Returns an ordered array of captured chip descriptors, or
 * `null` if the apply throws.
 *
 * @param {{ id: string, apply: (chipState: object) => void }} idiom
 * @param {{ noCache?: boolean }} [opts]
 * @returns {Array<{id:string,type:string,props:object}>|null}
 */
export function captureAnatomy(idiom, opts = {}) {
  if (!opts.noCache && _cache.has(idiom.id)) {
    return _cache.get(idiom.id);
  }

  /** @type {Array<{id:string,type:string,props:object}>} */
  const captured = [];
  let next = 1;

  /** Shared add logic — appends to captured in call order. */
  function recordAdd(type, props) {
    if (!chipTypes[type]) {
      // Unknown type: store it anyway (forwards-compat) without defaults.
      const id = 'sandbox-' + (next++);
      captured.push({ id, type, props: { ...(props || {}) } });
      return id;
    }
    const id = 'sandbox-' + (next++);
    captured.push({ id, type, props: mergedProps(type, props || {}) });
    return id;
  }

  const fake = {
    /**
     * Mirrors chip-state's add(type, props) signature.
     * Returns a fake id so idioms that chain addAfter(add(...), ...) work.
     */
    add(type, props = {}) {
      return recordAdd(type, props);
    },

    /**
     * Mirrors chip-state's addAfter(afterId, type, props) signature.
     * For the anatomy capture, ordering is preserved because each idiom's
     * addAfter chain calls are sequential and append in call order, which
     * IS the visual order the user will see in the chip area. (See the
     * CLAUDE.md deviation note: addAfter skips cleanupConnectors, so
     * captured order == display order.)
     */
    addAfter(_afterId, type, props = {}) {
      return recordAdd(type, props);
    },
  };

  let result;
  try {
    idiom.apply(fake);
    result = captured;
  } catch (err) {
    console.warn('[idiom-sandbox] apply() threw for idiom', idiom.id, err);
    result = null;
  }

  if (!opts.noCache) {
    _cache.set(idiom.id, result);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Dev-only self-check (runs once at module load, ~5ms)
// ---------------------------------------------------------------------------

/* eslint-disable no-console */
(function devCheck() {
  // Guard: only run in dev builds (Vite sets import.meta.env.DEV = true).
  // Falls through safely in production (import.meta.env is undefined → no-op).
  const isDev = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV);
  if (!isDev) return;

  // Lazy-import the idiom arrays to avoid circular-import risk at
  // module-evaluation time. We use dynamic import so the check is
  // genuinely async and non-blocking.
  Promise.all([
    import('./google.js'),
    import('./x.js'),
  ]).then(([googleMod, xMod]) => {
    const testIds = {
      google: ['subdomain-discovery', 'jp-gov-tld-chain'],
      x:      ['first-source', 'cross-script-name'],
    };
    const allIdioms = {
      google: googleMod.IDIOMS,
      x:      xMod.IDIOMS,
    };
    for (const [engine, ids] of Object.entries(testIds)) {
      for (const id of ids) {
        const idiom = allIdioms[engine].find(i => i.id === id);
        if (!idiom) {
          console.warn('[idiom-sandbox] DEV CHECK: idiom not found —', engine, id);
          continue;
        }
        const captured = captureAnatomy(idiom, { noCache: true });
        if (captured === null || captured.length === 0) {
          console.warn(
            '[idiom-sandbox] DEV CHECK: captureAnatomy returned',
            captured === null ? 'null' : 'empty array',
            'for', engine, id,
          );
        } else {
          console.debug(
            '[idiom-sandbox] DEV CHECK OK:', engine, id,
            '→', captured.length, 'chips',
            captured.map(c => c.type + '(' + (c.props.operator || c.props.value || c.props.metric || '') + ')').join(', '),
          );
        }
      }
    }
  }).catch(err => {
    console.warn('[idiom-sandbox] DEV CHECK: failed to load idiom modules', err);
  });
})();
