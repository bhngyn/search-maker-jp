// Wire the Arabic normalization toggle in the header and its info popover.
// Toggling fires `onChange` (which the bootstrap wires to the preview render)
// so the preview reflects the normalized form immediately.

/**
 * @param {object} args
 * @param {HTMLInputElement} args.normalizeInput
 * @param {HTMLButtonElement} args.infoBtn
 * @param {HTMLElement} args.infoPanel
 * @param {() => void} args.onChange
 */
export function wireNormalizeToggle({ normalizeInput, infoBtn, infoPanel, onChange }) {
  normalizeInput.addEventListener('change', onChange);
  infoBtn.addEventListener('click', () => {
    const open = infoPanel.hasAttribute('hidden');
    if (open) {
      infoPanel.removeAttribute('hidden');
      infoBtn.setAttribute('aria-expanded', 'true');
    } else {
      infoPanel.setAttribute('hidden', '');
      infoBtn.setAttribute('aria-expanded', 'false');
    }
  });
}
