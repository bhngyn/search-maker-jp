// Chip-state history (undo / redo).
//
// Keeps two bounded stacks of chip-array snapshots and exposes undo() / redo()
// that swap the live state via chipState.replaceAll(). Captures pre-mutation
// state by caching the latest snapshot and pushing it whenever a non-replace
// notification arrives.
//
// Scope: chip mutations only (Google + X). Facebook form state is not tracked
// here — its preview is a derived URL with no per-step history value.

const CAP = 50;

function clone(snapshot) {
  // chips are plain data ({ id, type, props }); structuredClone is safe and
  // detaches the references so later mutations to the live array don't bleed
  // into stored snapshots.
  return structuredClone(snapshot);
}

/**
 * @param {object} args
 * @param {ReturnType<import('./chip-state.js').createChipState>} args.chipState
 */
export function createHistory({ chipState }) {
  const undoStack = [];
  const redoStack = [];
  const listeners = new Set();
  let last = clone(chipState.getAll());
  let suspended = false;

  function notify() {
    listeners.forEach(cb => {
      try { cb(); } catch (e) { console.warn('history listener failed', e); }
    });
  }

  function pushUndo(snap) {
    undoStack.push(snap);
    if (undoStack.length > CAP) undoStack.shift();
  }

  chipState.subscribe((snapshot, change) => {
    // Restoring a snapshot fires this with kind === 'replace'. We must refresh
    // `last` (so the next real mutation pushes the correct baseline) but must
    // NOT push to either stack. Same for any change made while we're driving
    // the restore (suspended flag is belt-and-suspenders).
    if (suspended || change.kind === 'replace') {
      last = clone(snapshot);
      return;
    }
    pushUndo(last);
    redoStack.length = 0;
    last = clone(snapshot);
    notify();
  });

  function undo() {
    if (!undoStack.length) return false;
    const prev = undoStack.pop();
    redoStack.push(clone(last));
    suspended = true;
    chipState.replaceAll(prev);
    suspended = false;
    last = clone(prev);
    notify();
    return true;
  }

  function redo() {
    if (!redoStack.length) return false;
    const next = redoStack.pop();
    pushUndo(clone(last));
    suspended = true;
    chipState.replaceAll(next);
    suspended = false;
    last = clone(next);
    notify();
    return true;
  }

  function canUndo() { return undoStack.length > 0; }
  function canRedo() { return redoStack.length > 0; }

  function subscribe(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }

  return { undo, redo, canUndo, canRedo, subscribe };
}
