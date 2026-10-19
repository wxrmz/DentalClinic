import { useSyncExternalStore } from 'react';

export type MediaFlags = {
  reducedMotion: boolean;
  coarsePointer: boolean;
  isMobile: boolean;
};

const QUERIES = {
  reducedMotion: '(prefers-reduced-motion: reduce)',
  coarsePointer: '(pointer: coarse)',
  isMobile: '(max-width: 767px)',
} as const;

const SERVER_FLAGS: MediaFlags = { reducedMotion: false, coarsePointer: false, isMobile: false };

const hasMatchMedia = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function';

let cached: MediaFlags | null = null;

function read(): MediaFlags {
  if (!hasMatchMedia()) return SERVER_FLAGS;
  const next: MediaFlags = {
    reducedMotion: window.matchMedia(QUERIES.reducedMotion).matches,
    coarsePointer: window.matchMedia(QUERIES.coarsePointer).matches,
    isMobile: window.matchMedia(QUERIES.isMobile).matches,
  };
  if (
    cached &&
    cached.reducedMotion === next.reducedMotion &&
    cached.coarsePointer === next.coarsePointer &&
    cached.isMobile === next.isMobile
  ) {
    return cached;
  }
  cached = next;
  return next;
}

function subscribe(onChange: () => void): () => void {
  if (!hasMatchMedia()) return () => {};
  const lists = Object.values(QUERIES).map((q) => window.matchMedia(q));
  lists.forEach((l) => l.addEventListener('change', onChange));
  return () => lists.forEach((l) => l.removeEventListener('change', onChange));
}

export function getMediaFlags(): MediaFlags {
  return read();
}

export function useMediaFlags(): MediaFlags {
  return useSyncExternalStore(subscribe, read, () => SERVER_FLAGS);
}
