const listeners = new Set<() => void>();

export function onSyncComplete(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function emitSyncComplete(): void {
  for (const cb of listeners) {
    try {
      cb();
    } catch {
      // ignore
    }
  }
}
