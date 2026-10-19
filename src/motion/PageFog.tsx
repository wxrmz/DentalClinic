import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { gsap } from './gsap';
import { useMediaFlags } from './useMediaFlags';
import styles from './PageFog.module.css';

type BlobLook = {
  x: number;
  size: number;
  color: string;
  dur: number;
  delay: number;
};

const LOOKS: BlobLook[] = [
  { x: 86, size: 66, color: 'rgba(47, 181, 146, 0.64)', dur: 18, delay: -3 },
  { x: 6, size: 62, color: 'rgba(84, 190, 214, 0.53)', dur: 22, delay: -9 },
  { x: 60, size: 58, color: 'rgba(150, 214, 196, 0.36)', dur: 20, delay: -6 },
  { x: 22, size: 70, color: 'rgba(120, 214, 186, 0.70)', dur: 24, delay: -12 },
  { x: 98, size: 54, color: 'rgba(120, 196, 236, 0.48)', dur: 19, delay: -4 },
  { x: 42, size: 50, color: 'rgba(33, 160, 150, 0.36)', dur: 26, delay: -15 },
  { x: 72, size: 64, color: 'rgba(96, 204, 170, 0.59)', dur: 21, delay: -8 },
  { x: 34, size: 44, color: 'rgba(170, 222, 236, 0.56)', dur: 17, delay: -5 },
  { x: 8, size: 58, color: 'rgba(160, 216, 214, 0.34)', dur: 23, delay: -11 },
];

const STEP_VH = 0.38;
const SPEED = 0.88;

export function PageFog() {
  const trackRef = useRef<HTMLDivElement>(null);
  const { reducedMotion, coarsePointer } = useMediaFlags();
  const native = coarsePointer || reducedMotion;
  const cssDepth =
    native && !reducedMotion && typeof CSS !== 'undefined' && CSS.supports('animation-timeline: scroll()');
  const [count, setCount] = useState(0);

  useEffect(() => {
    const measure = () => {
      const pageScreens = document.documentElement.scrollHeight / window.innerHeight;
      setCount(Math.ceil(pageScreens / STEP_VH) + 2);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const k = native && !cssDepth ? 1 : SPEED;
    const setDepth = () => {
      if (!cssDepth) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      track.style.setProperty('--fog-depth', `${((1 - SPEED) * Math.max(0, max)).toFixed(0)}px`);
    };
    let last = NaN;
    let boxes: Array<{ el: HTMLElement; top: number; bottom: number; on: boolean }> = [];
    const measure = () => {
      boxes = Array.from(track.children as HTMLCollectionOf<HTMLElement>).map((el) => {
        el.removeAttribute('data-off');
        return { el, top: el.offsetTop, bottom: el.offsetTop + el.offsetHeight, on: true };
      });
      last = NaN;
    };
    const tick = () => {
      const y = window.scrollY;
      if (y === last) return;
      last = y;
      const shift = y * k;
      if (!native) track.style.transform = `translate3d(0, ${(-shift).toFixed(1)}px, 0)`;
      const from = shift - window.innerHeight * 0.5;
      const to = shift + window.innerHeight * 1.5;
      boxes.forEach((b) => {
        const on = b.bottom > from && b.top < to;
        if (on === b.on) return;
        b.on = on;
        if (on) b.el.removeAttribute('data-off');
        else b.el.setAttribute('data-off', '');
      });
    };
    measure();
    setDepth();
    tick();
    gsap.ticker.add(tick);
    window.addEventListener('resize', measure);
    window.addEventListener('resize', setDepth);
    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener('resize', measure);
      window.removeEventListener('resize', setDepth);
    };
  }, [native, cssDepth, count]);

  const track = (
    <div ref={trackRef} className={styles.track}>
      {Array.from({ length: count }, (_, i) => {
        const b = LOOKS[i % LOOKS.length];
        return (
          <div
            key={i}
            className={styles.wrap}
            style={
              {
                '--x': `${b.x}%`,
                '--y': `${(i * STEP_VH - 0.3) * 100}vh`,
                '--size': `${b.size}vmax`,
              } as CSSProperties
            }
          >
            <div
              className={styles.blob}
              style={
                {
                  '--color': b.color,
                  '--dur': `${b.dur}s`,
                  '--delay': `${b.delay}s`,
                } as CSSProperties
              }
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      <div className={styles.root} aria-hidden="true">
        {!native && track}
      </div>
      {native && (
        <div className={styles.native} aria-hidden="true" data-glide={cssDepth ? SPEED : 1}>
          {track}
        </div>
      )}
    </>
  );
}
