import { useLayoutEffect, useRef, useState } from 'react';
import { gsap, getMediaFlags } from '../../motion';
import { clinic } from '../../content';
import { emitSignal, onSignal } from './signals';
import styles from './index.module.css';

const MIN_MS = 900;
const MAX_MS = 4000;

function removeBootScreen(): void {
  document.getElementById('boot')?.remove();
}

export default function Preloader() {
  const [active, setActive] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const line = lineRef.current;
    const pct = pctRef.current;
    if (!active || !root || !line || !pct) return;
    removeBootScreen();

    const SCROLL_KEYS = new Set([' ', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown']);
    const block = (e: Event) => e.preventDefault();
    const blockKeys = (e: KeyboardEvent) => {
      if (SCROLL_KEYS.has(e.key)) e.preventDefault();
    };
    const opts: AddEventListenerOptions = { passive: false };
    window.addEventListener('touchmove', block, opts);
    window.addEventListener('wheel', block, opts);
    window.addEventListener('keydown', blockKeys);
    let locked = true;
    const unlock = () => {
      if (!locked) return;
      locked = false;
      window.removeEventListener('touchmove', block, opts);
      window.removeEventListener('wheel', block, opts);
      window.removeEventListener('keydown', blockKeys);
    };

    const progress = { v: 0 };
    const render = () => {
      line.style.transform = `scaleX(${(progress.v / 100).toFixed(4)})`;
      pct.textContent = `${Math.round(progress.v)}%`;
    };

    let disposed = false;
    let finished = false;
    let ramp: gsap.core.Tween | null = null;
    const ctx = gsap.context(() => {
      ramp = gsap.to(progress, { v: 90, duration: 1, ease: 'power2.out', onUpdate: render });
    }, root);

    const finish = () => {
      if (finished || disposed) return;
      finished = true;
      const reduced = getMediaFlags().reducedMotion;
      const center = root.firstElementChild;
      ctx.add(() => {
        ramp?.kill();
        const tl = gsap.timeline({ onComplete: () => setActive(false) });
        tl.to(progress, { v: 100, duration: 0.3, ease: 'power2.out', onUpdate: render });
        if (reduced) {
          tl.add(() => {
            unlock();
            emitSignal('preloader:done');
          }).to(root, { opacity: 0, duration: 0.3 });
          return;
        }
        tl.to(center, { y: -28, opacity: 0, duration: 0.5, ease: 'power2.in' }, '+=0.1')
          .add(() => {
            unlock();
            emitSignal('preloader:done');
          }, '-=0.1')
          .to(root, { opacity: 0, scale: 1.04, duration: 0.9, ease: 'power2.inOut' }, '<');
      });
    };

    let fontsOk = false;
    let heroOk = false;
    let loadOk = document.readyState === 'complete';
    let minOk = false;
    const check = () => {
      if (fontsOk && heroOk && loadOk && minOk) finish();
    };
    const onLoad = () => {
      loadOk = true;
      check();
    };
    if (!loadOk) window.addEventListener('load', onLoad, { once: true });

    const fonts = document.fonts as FontFaceSet | undefined;
    if (fonts) {
      fonts.ready.then(
        () => {
          fontsOk = true;
          check();
        },
        () => {
          fontsOk = true;
          check();
        },
      );
    } else {
      fontsOk = true;
    }
    const offHero = onSignal('hero:ready', () => {
      heroOk = true;
      check();
    });
    const minTimer = window.setTimeout(() => {
      minOk = true;
      check();
    }, MIN_MS);
    const maxTimer = window.setTimeout(finish, MAX_MS);

    return () => {
      disposed = true;
      window.clearTimeout(minTimer);
      window.clearTimeout(maxTimer);
      offHero();
      window.removeEventListener('load', onLoad);
      ctx.revert();
      unlock();
    };
  }, [active]);

  if (!active) return null;

  return (
    <div ref={rootRef} className={styles.root} aria-hidden="true" data-lenis-prevent="">
      <div className={styles.center}>
        <div className={styles.logo}>
          {clinic.name}
          <span className={styles.dot}>.</span>
        </div>
        <div className={styles.meter}>
          <span className={styles.track}>
            <span ref={lineRef} className={styles.line} />
          </span>
          <span ref={pctRef} className={styles.pct}>
            0%
          </span>
        </div>
      </div>
    </div>
  );
}
