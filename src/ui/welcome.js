// Wire the welcome panel — clicking anywhere on it dismisses. State is
// in-memory only (per the no-persist rule); refreshing restores it.

export function wireWelcomePanel() {
  const panel = document.getElementById('welcome-panel');
  if (!panel) return;

  panel.addEventListener('click', () => {
    document.body.classList.add('welcome-collapsed');
  });
}
