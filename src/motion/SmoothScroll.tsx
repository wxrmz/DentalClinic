import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap, ScrollTrigger } from './gsap';
import { getMediaFlags, useMediaFlags } from './useMediaFlags';

export type ScrollTarget = string | number | HTMLElement;

export type ScrollToOptions = {
  offset?: number;
  immediate?: boolean;
  lead?: number;
};

export type SmoothScrollApi = {
  scrollTo(target: ScrollTarget, opts?: ScrollToOptions): void;
};

const HEADER_FALLBACK = 72;

function headerOffset(): number {
  const h = document.querySelector('header')?.getBoundingClientRect().height ?? 0;
  return -(h > 0 ? h : HEADER_FALLBACK);
}

const CONTENT_GAP = 40;

function elementOffset(el: HTMLElement): number {
  const cs = getComputedStyle(el);
  const pad = parseFloat(cs.paddingTop) || 0;
  const gap = parseFloat(cs.getPropertyValue('--anchor-gap'));
  return headerOffset() + pad - (Number.isFinite(gap) ? gap : CONTENT_GAP);
}

function resolveElement(target: string | HTMLElement): HTMLElement | null {
  if (typeof target !== 'string') return target;
  try {
    return document.querySelector<HTMLElement>(target);
  } catch {
    return null;
  }
}

type Resolved = { el: HTMLElement | null; y: number | null };

function resolveTarget(target: ScrollTarget): Resolved | null {
  if (typeof target === 'number') return { el: null, y: target };
  if (target === '#' || target === '#top') return { el: null, y: 0 };
  const el = resolveElement(target);
  return el ? { el, y: null } : null;
}

const GLIDE_MIN = 800;
const GLIDE_MAX = 1300;
const GLIDE_BASE = 700;
const GLIDE_PER_PX = 0.1;
const GLIDE_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
let glides: Animation[] = [];

function glideIn(dist: number, lead: number) {
  glides.forEach((a) => a.cancel());
  const from = Math.sign(dist) * Math.min(Math.abs(dist), lead);
  const duration = Math.min(GLIDE_MAX, Math.max(GLIDE_MIN, GLIDE_BASE + Math.abs(from) * GLIDE_PER_PX));
  glides = Array.from(document.querySelectorAll<HTMLElement>('[data-glide]')).map((el) => {
    const k = Number(el.dataset.glide) || 1;
    return el.animate(
      [{ transform: `translate3d(0, ${(from * k).toFixed(1)}px, 0)` }, { transform: 'translate3d(0, 0, 0)' }],
      { duration, easing: GLIDE_EASE },
    );
  });
}

function nativeScrollTo(target: ScrollTarget, opts: ScrollToOptions = {}) {
  const r = resolveTarget(target);
  if (!r) return;
  let top: number;
  if (r.el) {
    top = r.el.getBoundingClientRect().top + window.scrollY + (opts.offset ?? elementOffset(r.el));
  } else {
    top = (r.y ?? 0) + (opts.offset ?? 0);
  }
  top = Math.max(0, Math.min(top, document.documentElement.scrollHeight - window.innerHeight));
  const instant = opts.immediate || getMediaFlags().reducedMotion;
  if (instant) {
    window.scrollTo({ top, behavior: 'auto' });
    return;
  }
  const dist = top - window.scrollY;
  if (opts.lead !== undefined) {
    window.scrollTo({ top, behavior: 'auto' });
    if (Math.abs(dist) >= 1) glideIn(dist, opts.lead);
    return;
  }
  window.scrollTo({ top, behavior: 'smooth' });
}

const SmoothScrollContext = createContext<SmoothScrollApi>({ scrollTo: nativeScrollTo });

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const { reducedMotion } = useMediaFlags();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (reducedMotion) return;
    const lenis = new Lenis({ autoRaf: false });
    lenisRef.current = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (!CSS.supports('-webkit-touch-callout', 'none')) return;
    let timer = 0;
    const nudge = () => {
      if (window.scrollY <= 0) window.scrollTo(0, 1);
    };
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(nudge, 150);
    };
    nudge();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loaded =
      document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise<void>((resolve) => window.addEventListener('load', () => resolve(), { once: true }));
    const fonts = document.fonts?.ready ?? Promise.resolve();
    Promise.all([fonts, loaded]).then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const scrollTo = useCallback((target: ScrollTarget, opts: ScrollToOptions = {}) => {
    const lenis = lenisRef.current;
    if (!lenis || getMediaFlags().coarsePointer) {
      nativeScrollTo(target, opts);
      return;
    }
    const r = resolveTarget(target);
    if (!r) return;
    if (r.el) {
      lenis.scrollTo(r.el, { offset: opts.offset ?? elementOffset(r.el), immediate: opts.immediate });
    } else {
      lenis.scrollTo(r.y ?? 0, { offset: opts.offset ?? 0, immediate: opts.immediate });
    }
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href^="#"]');
      if (!(a instanceof HTMLAnchorElement)) return;
      const href = a.getAttribute('href') ?? '#';
      if (href === '#' || href === '#top') {
        e.preventDefault();
        scrollTo(href);
        return;
      }
      const el = document.getElementById(decodeURIComponent(href.slice(1)));
      if (!el) return;
      e.preventDefault();
      scrollTo(el);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [scrollTo]);

  const api = useMemo<SmoothScrollApi>(() => ({ scrollTo }), [scrollTo]);
  return <SmoothScrollContext.Provider value={api}>{children}</SmoothScrollContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSmoothScroll(): SmoothScrollApi {
  return useContext(SmoothScrollContext);
}
