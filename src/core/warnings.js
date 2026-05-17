// Coaching warnings system. Multiple warnings can be visible at once.
// Slug-keyed: re-rendering a slug updates the existing element in place.

/**
 * @param {HTMLElement} warningRegion
 */
export function createWarnings(warningRegion) {
  const active = new Map(); // slug -> element

  function render(slug, messageHtml) {
    let el = active.get(slug);
    if (!el) {
      el = document.createElement('div');
      el.className = 'warning warning-' + slug;
      el.id = 'warning-' + slug;
      active.set(slug, el);
      warningRegion.appendChild(el);
    }
    el.innerHTML = messageHtml;
  }

  function clear(slug) {
    const el = active.get(slug);
    if (el) {
      el.remove();
      active.delete(slug);
    }
  }

  function clearAll() {
    Array.from(active.keys()).forEach(clear);
  }

  return { render, clear, clearAll };
}
