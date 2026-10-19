type SignalName = 'hero:ready' | 'preloader:done';

const fired: Record<SignalName, boolean> = { 'hero:ready': false, 'preloader:done': false };

export function emitSignal(name: SignalName): void {
  if (fired[name]) return;
  fired[name] = true;
  window.dispatchEvent(new Event(name));
}

export function onSignal(name: SignalName, cb: () => void): () => void {
  if (fired[name]) {
    cb();
    return () => {};
  }
  const handler = () => {
    window.removeEventListener(name, handler);
    cb();
  };
  window.addEventListener(name, handler);
  return () => window.removeEventListener(name, handler);
}
