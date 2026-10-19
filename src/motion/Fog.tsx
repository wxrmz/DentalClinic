import { useEffect, useRef, type CSSProperties } from 'react';
import { gsap } from './gsap';
import { useMediaFlags } from './useMediaFlags';
import { usePointer } from './usePointer';
import styles from './Fog.module.css';

type Blob = {
  top: string;
  left: string;
  size: string;
  color: string;
  opacity: number;
  dur: number;
  delay: number;
  k: number;
};

const BLOBS: Record<FogPreset, Blob[]> = {
  dense: [
    { top: '30%', left: '78%', size: 'clamp(300px, 32vw, 420px)', color: 'var(--fog-1)', opacity: 0.85, dur: 13, delay: -2, k: 1 },
    { top: '68%', left: '62%', size: 'clamp(260px, 26vw, 360px)', color: 'var(--fog-2)', opacity: 0.9, dur: 16, delay: -7, k: 0.45 },
    { top: '20%', left: '28%', size: 'clamp(260px, 24vw, 340px)', color: 'var(--fog-3)', opacity: 0.7, dur: 11, delay: -4, k: -0.8 },
    { top: '78%', left: '14%', size: 'clamp(280px, 28vw, 400px)', color: 'var(--fog-4)', opacity: 0.8, dur: 14, delay: -9, k: -0.35 },
  ],
  soft: [
    { top: '25%', left: '82%', size: 'clamp(260px, 28vw, 400px)', color: 'var(--fog-2)', opacity: 0.75, dur: 15, delay: -3, k: 0.7 },
    { top: '75%', left: '12%', size: 'clamp(260px, 24vw, 360px)', color: 'var(--fog-4)', opacity: 0.8, dur: 12, delay: -8, k: -0.5 },
  ],
};

const SCROLL_Y_PERCENT = 30;

export type FogPreset = 'dense' | 'soft';

export function Fog({ preset, className }: { preset: FogPreset; className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer();
  const { reducedMotion, coarsePointer, isMobile } = useMediaFlags();
  const blobs = BLOBS[preset];

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion || coarsePointer) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>(`.${styles.blob}`));
    let lastX = NaN;
    let lastY = NaN;
    const tick = () => {
      const { x, y } = pointer.current;
      if (x === lastX && y === lastY) return;
      lastX = x;
      lastY = y;
      els.forEach((el, i) => {
        const k = blobs[i]?.k ?? 0;
        el.style.translate = `${(x * 50 * k).toFixed(2)}px ${(y * 36 * k).toFixed(2)}px`;
      });
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      els.forEach((el) => {
        el.style.translate = '';
      });
    };
  }, [blobs, pointer, reducedMotion, coarsePointer]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion || coarsePointer) return;
    const factor = isMobile ? 0.5 : 1;
    const ctx = gsap.context(() => {
      const wraps = gsap.utils.toArray<HTMLElement>(`.${styles.blobWrap}`, root);
      wraps.forEach((wrap, i) => {
        const amp = (blobs[i]?.k ?? 0) * SCROLL_Y_PERCENT * factor;
        if (amp === 0) return;
        gsap.fromTo(
          wrap,
          { yPercent: amp },
          {
            yPercent: -amp,
            ease: 'none',
            scrollTrigger: { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      });
    }, root);
    return () => ctx.revert();
  }, [blobs, reducedMotion, isMobile, coarsePointer]);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className={[styles.root, styles[preset], className].filter(Boolean).join(' ')}
    >
      {blobs.map((b, i) => (
        <div
          key={i}
          className={styles.blobWrap}
          style={{ '--top': b.top, '--left': b.left, '--size': b.size } as CSSProperties}
        >
          <div
            className={styles.blob}
            style={
              {
                '--color': b.color,
                '--opacity': b.opacity,
                '--dur': `${b.dur}s`,
                '--delay': `${b.delay}s`,
              } as CSSProperties
            }
          />
        </div>
      ))}
    </div>
  );
}
