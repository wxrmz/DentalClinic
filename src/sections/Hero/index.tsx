import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { IconStarFilled } from '@tabler/icons-react';
import { Counter, Fog, gsap, useMediaFlags, usePointer } from '../../motion';
import { ShaderCanvas, type UniformMap } from '../../gl/ShaderCanvas';
import toothFrag from '../../gl/shaders/tooth.frag.glsl?raw';
import { clinic } from '../../content';
import { emitSignal, onSignal } from '../Preloader/signals';
import styles from './index.module.css';

const { hero } = clinic;

function formatStat(value: number, decimals = 0, suffix = '') {
  const nf = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return `${nf.format(value).replace(/[\u00A0\u202F]/g, '\u202F')}${suffix}`;
}

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const toothRef = useRef<HTMLDivElement>(null);
  const toothEnterRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const turn = useRef({ v: 0 });

  const { reducedMotion, isMobile, coarsePointer } = useMediaFlags();
  const pointer = usePointer(heroRef);
  const [glFailed, setGlFailed] = useState(false);
  const [entered, setEntered] = useState(false);
  const countersOn = entered || reducedMotion;

  const followPointer = !isMobile;
  const lastTilt = useRef('');
  const getUniforms = useCallback(
    (time: number): UniformMap => {
      const x = followPointer ? pointer.current.x : 0;
      const y = followPointer ? pointer.current.y : 0;
      const tilt = tiltRef.current;
      const tf = `translate3d(${(x * -16).toFixed(1)}px, ${(y * -12).toFixed(1)}px, 0)`;
      if (tilt && tf !== lastTilt.current) {
        lastTilt.current = tf;
        tilt.style.transform = tf;
      }
      return { T: time, M: [x + turn.current.v, y] };
    },
    [followPointer, pointer],
  );

  const onReady = useCallback(() => emitSignal('hero:ready'), []);
  const onError = useCallback(() => {
    setGlFailed(true);
    emitSignal('hero:ready');
  }, []);

  useLayoutEffect(() => {
    const text = textRef.current;
    const tooth = toothEnterRef.current;
    if (reducedMotion || !text) return;
    const lines = text.querySelectorAll<HTMLElement>('[data-enter]');
    const turnState = turn.current;
    let off = () => {};
    const ctx = gsap.context(() => {
      gsap.set(lines, { y: 40, opacity: 0 });
      if (tooth) gsap.set(tooth, { scale: 0.85, opacity: 0 });
      turnState.v = -0.5;
      const tl = gsap.timeline({ paused: true });
      tl.to(lines, { y: 0, opacity: 1, duration: 0.9, stagger: 0.08, ease: 'power3.out' }, 0);
      if (tooth) tl.to(tooth, { scale: 1, opacity: 1, duration: 1.2, ease: 'power3.out' }, 0.1);
      tl.to(turnState, { v: 0, duration: 1.6, ease: 'power3.out' }, 0.1);
      off = onSignal('preloader:done', () => {
        tl.play();
        setEntered(true);
      });
    }, text);
    return () => {
      off();
      ctx.revert();
      turnState.v = 0;
    };
  }, [reducedMotion]);

  useEffect(() => {
    const root = heroRef.current;
    const text = textRef.current;
    const tooth = toothRef.current;
    if (reducedMotion || coarsePointer || !root || !text) return;
    const ctx = gsap.context(() => {
      const scrollTrigger = { trigger: root, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true };
      if (tooth) {
        gsap.to(tooth, {
          y: () => -0.12 * window.innerHeight,
          scale: 0.9,
          opacity: 0.2,
          ease: 'none',
          scrollTrigger,
        });
      }
      gsap.to(text, {
        y: () => -0.18 * window.innerHeight,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { ...scrollTrigger },
      });
    }, root);
    return () => ctx.revert();
  }, [reducedMotion, coarsePointer, glFailed]);

  return (
    <section id="top" ref={heroRef} className={styles.root}>
      <Fog preset="dense" />

      {!glFailed && (
        <div ref={toothRef} className={styles.tooth} aria-hidden="true">
          <div ref={toothEnterRef} className={styles.toothLayer}>
            <div ref={tiltRef} className={styles.toothLayer}>
              <ShaderCanvas
                fragment={toothFrag}
                getUniforms={getUniforms}
                dprCap={1.25}
                onReady={onReady}
                onError={onError}
                className={styles.canvas}
              />
            </div>
          </div>
        </div>
      )}

      <div className={`container ${styles.inner}`}>
        <div ref={textRef} className={styles.text}>
          <p className={`eyebrow ${styles.eyebrow}`} data-enter="">
            {hero.eyebrow}
          </p>
          <h1 className={styles.title}>
            {hero.titleLines.map((line) => (
              <span key={line} className={styles.line} data-enter="">
                {line}{' '}
              </span>
            ))}
            <span className={`${styles.line} ${styles.accent}`} data-enter="">
              {hero.titleAccent}
            </span>
          </h1>
          <p className={styles.lead} data-enter="">
            {hero.lead}
          </p>
          <div className={styles.actions} data-enter="">
            <a href="#contacts" className={`btn-fx ${styles.btn} ${styles.btnPrimary}`}>
              {hero.ctaPrimary}
            </a>
            <a href="#prices" className={`btn-fx ${styles.btn} ${styles.btnSecondary}`}>
              {hero.ctaSecondary}
            </a>
          </div>
          <ul className={styles.stats} data-enter="">
            {hero.stats.map((s) => (
              <li key={s.label} className={s.star ? `${styles.stat} ${styles.statCentered}` : styles.stat}>
                <span className={styles.statValue}>
                  {s.star && <IconStarFilled className={styles.statStar} aria-hidden="true" />}
                  {countersOn ? (
                    <Counter value={s.value} decimals={s.decimals ?? 0} suffix={s.suffix ?? ''} immediate delay={0.35} />
                  ) : (
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatStat(s.value, s.decimals, s.suffix)}
                    </span>
                  )}
                </span>
                <span className={styles.statLabel}>{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
