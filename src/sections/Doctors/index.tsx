import { useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { doctors, doctorsSection } from '../../content/doctors';
import { gsap, Reveal, ScrollTrigger, useMediaFlags, useSmoothScroll } from '../../motion';
import { ShapeAvatar } from './ShapeAvatar';
import styles from './index.module.css';

const VISIBLE = doctorsSection.visibleCount;
const extraDoctors = doctors.slice(VISIBLE);

export default function Doctors() {
  const sectionRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { reducedMotion, isMobile, coarsePointer } = useMediaFlags();
  const { scrollTo } = useSmoothScroll();
  const [open, setOpen] = useState(false);
  const busy = useRef(false);
  const toggleGen = useRef(0);
  const labelRef = useRef<HTMLSpanElement>(null);
  const morphFrom = useRef<number | null>(null);
  const morphs = useRef<Animation[]>([]);
  const extraTriggers = useRef<ScrollTrigger[]>([]);

  const grid = () => sectionRef.current?.querySelector<HTMLElement>(`.${styles.grid}`) ?? null;
  const extras = () =>
    Array.from(sectionRef.current?.querySelectorAll<HTMLElement>('[data-extra]') ?? []);

  const refreshBelow = () => {
    const g = grid();
    if (!g) return;
    const root = document.documentElement;
    ScrollTrigger.getAll()
      .filter((t) => {
        const el = t.trigger as Element | undefined;
        if (!el || el === root || el === document.body || el === g) return true;
        return (
          !g.contains(el) &&
          Boolean(g.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING)
        );
      })
      .forEach((t) => t.refresh());
  };
  const settle = () => {
    busy.current = false;
    requestAnimationFrame(refreshBelow);
  };

  useLayoutEffect(() => {
    const g = grid();
    if (!g || reducedMotion || coarsePointer) return;
    const ctx = gsap.context(() => {
      const track = (t: gsap.core.Tween, el: Element) => {
        if (el.closest('[data-extra]') && t.scrollTrigger)
          extraTriggers.current.push(t.scrollTrigger);
      };
      gsap.utils.toArray<HTMLElement>(`.${styles.frame}`, g).forEach((frame) => {
        const st = { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true };
        const bg = frame.querySelector('[data-layer="bg"]');
        const fig = frame.querySelector('[data-layer="figure"]');
        if (bg)
          track(gsap.fromTo(bg, { y: -36 }, { y: 36, ease: 'none', scrollTrigger: st }), frame);
        if (fig)
          track(gsap.fromTo(fig, { y: 26 }, { y: -12, ease: 'none', scrollTrigger: st }), frame);
      });
      if (!isMobile) {
        const cols = getComputedStyle(g).gridTemplateColumns.split(' ').length || 4;
        gsap.utils.toArray<HTMLElement>(`.${styles.lift}`, g).forEach((el, i) => {
          gsap.fromTo(
            el,
            { y: 0 },
            {
              y: (i % cols) % 2 === 0 ? -35 : 50,
              ease: 'none',
              scrollTrigger: { trigger: g, start: 'top 90%', end: 'bottom 10%', scrub: 0.6 },
            },
          );
        });
      }
    }, g);
    return () => {
      extraTriggers.current = [];
      ctx.revert();
    };
  }, [reducedMotion, isMobile, coarsePointer]);

  const pressAt = useRef(0);
  const MIN_PRESS = 250;
  const pressStart = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse') return;
    pressAt.current = performance.now();
    e.currentTarget.setAttribute('data-press', '');
  };
  const pressEnd = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse') return;
    const btn = e.currentTarget;
    const wait = Math.max(0, MIN_PRESS - (performance.now() - pressAt.current));
    window.setTimeout(() => btn.removeAttribute('data-press'), wait);
  };

  useLayoutEffect(() => {
    const btn = buttonRef.current;
    const box = labelRef.current;
    const from = morphFrom.current;
    morphFrom.current = null;
    if (!btn || !box || from === null || reducedMotion) return;
    morphs.current.forEach((a) => a.cancel());
    morphs.current = [];
    const play = (el: Element | null, frames: Keyframe[], opts: KeyframeAnimationOptions) => {
      if (el) morphs.current.push(el.animate(frames, opts));
    };
    const half = (from - btn.offsetWidth) / 2;
    const glide = { duration: 650, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' };
    btn.querySelectorAll('[data-morph]').forEach((el) => {
      const dx = el.getAttribute('data-morph') === 'l' ? -half : half;
      play(el, [{ transform: `translateX(${dx}px)` }, { transform: 'none' }], glide);
    });
    play(
      box.querySelector(':scope > :not([data-on])'),
      [
        { opacity: 1, transform: 'none' },
        { opacity: 0, transform: 'translateY(-8px)' },
      ],
      { duration: 260, easing: 'cubic-bezier(0.55, 0, 1, 0.45)' },
    );
    play(
      box.querySelector('[data-on]'),
      [
        { opacity: 0, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'none' },
      ],
      {
        duration: 420,
        delay: half < 0 ? 380 : 240,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'backwards',
      },
    );
  }, [open, reducedMotion]);
  useLayoutEffect(() => () => morphs.current.forEach((a) => a.cancel()), []);

  const toggle = () => {
    const g = grid();
    if (!g || busy.current) return;
    const btn = buttonRef.current;
    const pl = btn?.querySelector('[data-pill="l"]');
    const pr = btn?.querySelector('[data-pill="r"]');
    morphFrom.current =
      pl && pr ? pr.getBoundingClientRect().right - pl.getBoundingClientRect().left : null;
    const cards = extras();
    const show = (on: boolean) => cards.forEach((c) => (c.style.display = on ? 'block' : ''));

    if (reducedMotion) {
      show(!open);
      setOpen(!open);
      requestAnimationFrame(refreshBelow);
      return;
    }
    busy.current = true;
    setOpen(!open);
    const gen = ++toggleGen.current;

    if (isMobile) {
      gsap.killTweensOf(cards);
      g.style.scrollSnapType = 'none';
      const resumeSnap = () => {
        g.style.scrollSnapType = '';
      };
      g.addEventListener('touchstart', resumeSnap, { once: true, passive: true });
      g.addEventListener('wheel', resumeSnap, { once: true, passive: true });

      if (!open) {
        const midCollapse = cards[0]?.style.display === 'block';
        show(true);
        extraTriggers.current.forEach((t) => t.refresh());
        const first = cards[0];
        if (first) {
          const PEEK = 110;
          const left =
            first.getBoundingClientRect().left - g.getBoundingClientRect().left + g.scrollLeft;
          const target = Math.min(
            g.scrollWidth - g.clientWidth,
            Math.max(0, left - (g.clientWidth - PEEK)),
          );
          g.scrollTo({ left: target, behavior: 'smooth' });
        }
        const fadeIn = {
          opacity: 1,
          x: 0,
          duration: 0.7,
          ease: 'power2.out',
          stagger: 0.08,
          force3D: true,
          clearProps: 'opacity,transform',
          onComplete: settle,
        };
        if (midCollapse) gsap.to(cards, fadeIn);
        else gsap.fromTo(cards, { opacity: 0, x: 40 }, fadeIn);
        busy.current = false;
        return;
      }

      const remaining = Array.from(g.children).filter((c) => !c.hasAttribute('data-extra'));
      const last = remaining[remaining.length - 1] as HTMLElement | undefined;
      const padEnd = parseFloat(getComputedStyle(g).paddingRight) || 0;
      const maxLeft = last
        ? Math.max(
            0,
            last.getBoundingClientRect().right -
              g.getBoundingClientRect().left +
              g.scrollLeft +
              padEnd -
              g.clientWidth,
          )
        : 0;
      const target = Math.min(g.scrollLeft, maxLeft);
      const strip = g;
      const scrolled = new Promise<void>((resolve) => {
        if (strip.scrollLeft - target < 1) return resolve();
        const done = () => {
          window.clearTimeout(timer);
          strip.removeEventListener('scrollend', done);
          resolve();
        };
        const timer = window.setTimeout(done, 900);
        strip.addEventListener('scrollend', done);
        strip.scrollTo({ left: target, behavior: 'smooth' });
      });
      const faded = gsap
        .to(cards, {
          opacity: 0,
          x: 30,
          duration: 0.4,
          ease: 'power2.inOut',
          stagger: 0.03,
          force3D: true,
        })
        .then();
      busy.current = false;
      void Promise.all([scrolled, faded]).then(() => {
        if (gen !== toggleGen.current) return;
        show(false);
        gsap.set(cards, { clearProps: 'opacity,transform' });
        settle();
      });
      return;
    }

    const from = g.offsetHeight;

    if (!open) {
      show(true);
      extraTriggers.current.forEach((t) => t.refresh());
      ScrollTrigger.getAll()
        .filter((t) => t.trigger === g)
        .forEach((t) => t.refresh());
      const to = g.offsetHeight;
      gsap.set(cards, { opacity: 0, y: 90, scale: 0.9, rotate: (i: number) => (i % 2 ? 3 : -3) });
      gsap
        .timeline({ onComplete: settle })
        .fromTo(
          g,
          { height: from, overflow: 'hidden' },
          { height: to, duration: 0.8, ease: 'power3.inOut' },
        )
        .to(
          cards,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            rotate: 0,
            duration: 0.9,
            ease: 'power3.out',
            stagger: 0.1,
          },
          0.15,
        )
        .set(g, { clearProps: 'height,overflow' })
        .set(cards, { clearProps: 'opacity,transform' });
      return;
    }

    show(false);
    const to = g.offsetHeight;
    show(true);
    const startY = window.scrollY;
    const shift = { d: 0 };
    const dur = 0.8;
    let follow = true;
    const userEvents = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
    const release = () => {
      follow = false;
      userEvents.forEach((t) => window.removeEventListener(t, release, true));
    };
    userEvents.forEach((t) => window.addEventListener(t, release, { capture: true, passive: true }));

    gsap
      .timeline({
        onComplete: () => {
          release();
          show(false);
          gsap.set(cards, { clearProps: 'opacity,transform' });
          gsap.set(g, { clearProps: 'height,overflow' });
          settle();
        },
      })
      .to(
        [...cards].reverse(),
        {
          opacity: 0,
          y: 90,
          scale: 0.9,
          rotate: (i: number) => (i % 2 ? -3 : 3),
          duration: 0.6,
          ease: 'power3.in',
          stagger: 0.07,
        },
        0,
      )
      .fromTo(
        g,
        { height: from, overflow: 'hidden' },
        { height: to, duration: dur, ease: 'power3.inOut' },
        0.25,
      )
      .to(
        shift,
        {
          d: from - to,
          duration: dur,
          ease: 'power3.inOut',
          onUpdate: () => {
            if (follow) scrollTo(startY - shift.d, { immediate: true });
          },
        },
        0.25,
      );
  };

  return (
    <section id="doctors" ref={sectionRef} className={styles.root}>
      <div className="container">
        <Reveal className={styles.head}>
          <p className="eyebrow">{doctorsSection.eyebrow}</p>
          <h2 className={styles.title}>{doctorsSection.title}</h2>
        </Reveal>
        <Reveal as="ul" stagger={0.1} className={styles.grid}>
          {doctors.map((d, i) => (
            <li
              key={d.name}
              className={i >= VISIBLE ? `${styles.card} ${styles.collapsed}` : styles.card}
              data-extra={i >= VISIBLE ? '' : undefined}
            >
              <div className={styles.lift}>
                <div className={styles.frame}>
                  <ShapeAvatar avatar={d.avatar} label={d.alt} />
                  <span className={styles.chip}>
                    стаж {d.experienceYears} {pluralYears(d.experienceYears)}
                  </span>
                </div>
                <h3 className={styles.name}>{d.name}</h3>
                <p className={styles.role}>{d.role}</p>
              </div>
            </li>
          ))}
        </Reveal>

        <div className={styles.moreWrap}>
          <button
            ref={buttonRef}
            type="button"
            className={styles.moreBtn}
            data-expanded={open || undefined}
            aria-expanded={open}
            onClick={toggle}
            onPointerDown={pressStart}
            onPointerUp={pressEnd}
            onPointerCancel={pressEnd}
            onPointerLeave={pressEnd}
          >
            {(['l', 'r'] as const).map((side) => (
              <span key={side} className={styles.moreChrome} data-side={side} aria-hidden="true">
                <span className={styles.morePill} data-pill={side} data-morph={side}>
                  <span className={styles.moreFill} />
                </span>
              </span>
            ))}
            <span className={styles.stack} data-morph="l" aria-hidden="true">
              {extraDoctors.slice(0, 3).map((d) => (
                <span key={d.avatar} className={styles.stackItem}>
                  <ShapeAvatar avatar={d.avatar} face />
                </span>
              ))}
            </span>
            <span ref={labelRef} className={styles.moreLabel} data-morph="l">
              <span data-on={!open || undefined} aria-hidden={open || undefined}>
                {doctorsSection.expandLabel}
              </span>
              <span data-on={open || undefined} aria-hidden={!open || undefined}>
                {doctorsSection.collapseLabel}
              </span>
            </span>
            <span className={styles.moreIconSlot} data-morph="r" aria-hidden="true">
              <span className={styles.moreIcon}>
                <IconPlus size={20} stroke={2} />
              </span>
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}

function pluralYears(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'год';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'года';
  return 'лет';
}
