// `ctx` is the integration seam between the bootstrap and every chip,
// warning, and tip module. The shape was originally defined by CONTRACT.md
// for the form-based architecture; the field-registry surface is gone now
// that the chip composer is the only input UI.

/**
 * @typedef {object} Ctx
 * @property {(order: number, fn: () => string) => void} registerSegment
 * @property {() => void} requestUpdate
 * @property {(slug: string, html: string) => void} addWarning
 * @property {(slug: string) => void} removeWarning
 * @property {(slug: string, opts: { priority: number, messageHtml: string }) => void} addTip
 * @property {(slug: string) => void} removeTip
 * @property {(text: string) => string} normalize
 * @property {() => 'ja' | 'en'} getLang
 * @property {(cb: (lang: string) => void) => void} onLangChange
 */

/**
 * @param {object} args
 * @param {Array<{ order: number, fn: () => string }>} args.segments
 * @param {(text: string) => string} args.normalize
 * @param {() => void} args.requestUpdate
 * @param {{ render: (slug: string, html: string) => void, clear: (slug: string) => void }} args.warnings
 * @param {{ add: (slug: string, opts: any) => void, remove: (slug: string) => void }} args.tips
 * @param {{ get: () => 'ja' | 'en', on: (cb: (lang: string) => void) => void }} [args.lang]
 * @returns {Ctx}
 */
export function createCtx({ segments, normalize, requestUpdate, warnings, tips, lang }) {
  return {
    registerSegment(order, fn) { segments.push({ order, fn }); },
    requestUpdate,
    addWarning(slug, html) { warnings.render(slug, html); },
    removeWarning(slug) { warnings.clear(slug); },
    addTip(slug, opts) { tips.add(slug, opts); },
    removeTip(slug) { tips.remove(slug); },
    normalize,
    getLang: lang ? lang.get : () => 'ja',
    onLangChange: lang ? lang.on : () => {},
  };
}
