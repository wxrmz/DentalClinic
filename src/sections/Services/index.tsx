import { useEffect, useRef, useState, type ComponentType, type CSSProperties } from 'react';
import { flushSync } from 'react-dom';
import {
  IconCrown,
  IconDental,
  IconDentalBroken,
  IconFirstAidKit,
  IconMoodSmile,
  IconSparkles,
  IconSun,
  type IconProps,
} from '@tabler/icons-react';
import { services, servicesSection } from '../../content/services';
import type { Service, ServiceIcon } from '../../content/types';
import { Reveal, useMediaFlags } from '../../motion';
import styles from './index.module.css';

const ICONS: Record<ServiceIcon, ComponentType<IconProps>> = {
  dental: IconDentalBroken,
  sparkles: IconSparkles,
  screw: IconDental,
  crown: IconCrown,
  brackets: IconMoodSmile,
  sun: IconSun,
  'first-aid': IconFirstAidKit,
};

const TINTS: Record<Service['id'], [string, string]> = {
  caries: ['#1F9A7B', '#4FC4A1'],
  hygiene: ['#2F8FB0', '#6FC3DD'],
  implants: ['#17785F', '#2FB592'],
  prosthetics: ['#2F7488', '#5FB3C9'],
  orthodontics: ['#2C9C80', '#6FD0B0'],
  whitening: ['#C99A33', '#EBC66A'],
  surgery: ['#22645C', '#3E9A8D'],
};

const priceFormat = new Intl.NumberFormat('ru-RU');
const fromPrice = (n: number) => `от ${priceFormat.format(n)} ₽`;

const ACCORDION = '(max-width: 1023px)';
const DURATION = 500;
const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

type Running = { finish: () => void };

function followingBlocks(list: HTMLElement): HTMLElement[] {
  const out: HTMLElement[] = [];
  let n = list.closest('section')?.nextElementSibling ?? null;
  while (n) {
    if (n instanceof HTMLElement) out.push(n);
    n = n.nextElementSibling;
  }
  const footer = document.querySelector('footer');
  if (footer) out.push(footer);
  return out.filter((el) => el.getBoundingClientRect().top < window.innerHeight);
}

function openPrices(id: Service['id']) {
  window.dispatchEvent(new CustomEvent('prices:open', { detail: id }));
}

const held = new Map<HTMLElement, Animation>();
let heldWatch: IntersectionObserver | null = null;

function releaseHeld(el?: HTMLElement) {
  const targets = el ? [el] : [...held.keys()];
  targets.forEach((t) => {
    held.get(t)?.cancel();
    held.delete(t);
    heldWatch?.unobserve(t);
  });
}

function holdUntilOffscreen(el: HTMLElement, anim: Animation) {
  heldWatch ??= new IntersectionObserver((entries) =>
    entries.forEach((e) => {
      if (!e.isIntersecting) releaseHeld(e.target as HTMLElement);
    }),
  );
  held.set(el, anim);
  heldWatch.observe(el);
}

function animateFrom(
  el: HTMLElement,
  frames: Keyframe[],
  timing: KeyframeAnimationOptions,
  restores: (() => void)[],
): Animation {
  const style = el.style as unknown as Record<string, string>;
  Object.entries(frames[0]).forEach(([key, value]) => {
    const prev = style[key];
    style[key] = String(value);
    const set = style[key];
    restores.push(() => {
      if (style[key] === set) style[key] = prev;
    });
  });
  return el.animate(frames, timing);
}

function foldLook(
  card: HTMLElement,
  full: number,
  hiddenFrom: number,
  hiddenTo: number,
  timing: KeyframeAnimationOptions,
  restores: (() => void)[],
): Animation[] {
  const collapsed = full - Math.max(hiddenFrom, hiddenTo);
  const layer = (height: number) => {
    const el = document.createElement('div');
    el.className = styles.look;
    el.style.height = `${height}px`;
    return el;
  };
  const folded = layer(collapsed);
  const open = layer(full);
  card.prepend(folded, open);
  restores.push(() => {
    folded.remove();
    open.remove();
  });
  const scale = (height: number, hidden: number) => `scaleY(${(full - hidden) / height})`;
  const [shownFrom, shownTo] = hiddenFrom > hiddenTo ? [0, 1] : [1, 0];
  const glow = (hidden: number) => ({ transform: `translateY(${0.3 * hidden}px)` });
  card.style.setProperty('--glow', `${0.3 * hiddenFrom}px`);
  restores.push(() => card.style.removeProperty('--glow'));
  return [
    animateFrom(
      folded,
      [{ transform: scale(collapsed, hiddenFrom) }, { transform: scale(collapsed, hiddenTo) }],
      timing,
      restores,
    ),
    animateFrom(
      open,
      [
        { transform: scale(full, hiddenFrom), opacity: shownFrom },
        { transform: scale(full, hiddenTo), opacity: shownTo },
      ],
      timing,
      restores,
    ),
    card.animate([glow(hiddenFrom), glow(hiddenTo)], { ...timing, pseudoElement: '::before' }),
  ];
}

function animateAccordion(
  list: HTMLElement,
  prev: number,
  next: number,
  apply: (active: number) => void,
  onDone: () => void,
): Running {
  releaseHeld();
  const panels = Array.from(list.children) as HTMLElement[];
  const html = document.documentElement;
  html.style.overflowAnchor = 'none';

  const movers = [...panels, ...followingBlocks(list)];
  const before = movers.map((el) => el.getBoundingClientRect().top);
  const openBefore = next >= 0 ? panels[next].getBoundingClientRect().height : 0;
  const closingPanel = prev >= 0 && prev !== next ? panels[prev] : null;
  const shrink = closingPanel
    ? closingPanel.getBoundingClientRect().height -
      (closingPanel.querySelector('button') as HTMLElement).getBoundingClientRect().height
    : 0;
  if (closingPanel) {
    closingPanel.dataset.closing = '';
    closingPanel.style.marginBottom = `${-shrink}px`;
  }

  flushSync(() => apply(next));

  const after = movers.map((el) => el.getBoundingClientRect().top);
  const grow = next >= 0 ? panels[next].getBoundingClientRect().height - openBefore : 0;
  const timing: KeyframeAnimationOptions = { duration: DURATION, easing: EASING, fill: 'forwards' };
  const move = (from: number, to: number) => [
    { transform: `translateY(${from}px)` },
    { transform: `translateY(${to}px)` },
  ];

  const anims: Animation[] = [];
  const blocks: [HTMLElement, Animation][] = [];
  const restores: (() => void)[] = [];
  movers.forEach((el, k) => {
    const from = before[k] - after[k];
    if (k >= panels.length) {
      if (Math.abs(from) >= 0.01)
        blocks.push([el, animateFrom(el, move(from, 0), timing, restores)]);
      return;
    }
    const hiddenFrom = k === next ? grow : 0;
    const hiddenTo = el === closingPanel ? shrink : 0;
    if (Math.abs(from) < 0.01 && hiddenFrom === 0 && hiddenTo === 0) return;
    anims.push(animateFrom(el, move(from - hiddenFrom, -hiddenTo), timing, restores));
    if (hiddenFrom !== 0 || hiddenTo !== 0) {
      const card = el.firstElementChild as HTMLElement;
      const full = card.getBoundingClientRect().height;
      anims.push(animateFrom(card, move(hiddenFrom, hiddenTo), timing, restores));
      anims.push(...foldLook(card, full, hiddenFrom, hiddenTo, timing, restores));
    }
  });

  const all = [...anims, ...blocks.map(([, a]) => a)];
  let done = false;
  let anchorRaf = 0;
  const finish = () => {
    if (done) return;
    done = true;
    onDone();
    if (closingPanel) {
      delete closingPanel.dataset.closing;
      closingPanel.style.marginBottom = '';
    }
    restores.reverse().forEach((restore) => restore());
    anims.forEach((a) => a.cancel());
    blocks.forEach(([el, a]) => {
      a.finish();
      holdUntilOffscreen(el, a);
    });
    anchorRaf = requestAnimationFrame(() => {
      html.style.overflowAnchor = '';
    });
  };
  if (all.length) all[0].finished.then(finish, () => {});
  else finish();
  return {
    finish: () => {
      cancelAnimationFrame(anchorRaf);
      finish();
    },
  };
}

export default function Services() {
  const [active, setActive] = useState(0);
  const { coarsePointer, reducedMotion } = useMediaFlags();
  const running = useRef<Running | null>(null);

  useEffect(
    () => () => {
      running.current?.finish();
      releaseHeld();
    },
    [],
  );

  useEffect(() => {
    const mq = window.matchMedia(ACCORDION);
    const onChange = () => {
      if (!mq.matches) setActive((a) => (a < 0 ? 0 : a));
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const toggle = (i: number, from: HTMLElement) => {
    const accordion = window.matchMedia(ACCORDION).matches;
    const list = from.closest('ul');
    if (!accordion || reducedMotion || !list) {
      setActive((a) => (accordion && a === i ? -1 : i));
      return;
    }
    running.current?.finish();
    const next = active === i ? -1 : i;
    running.current = animateAccordion(
      list,
      active,
      next,
      (a) => setActive(a),
      () => {
        running.current = null;
      },
    );
  };

  return (
    <section id="services" className={styles.root}>
      <div className="container">
        <div className={styles.header}>
          <Reveal>
            <p className="eyebrow">{servicesSection.eyebrow}</p>
            <h2 className={styles.title}>{servicesSection.title}</h2>
          </Reveal>
        </div>

        <Reveal as="ul" stagger={0.05} className={styles.panels}>
          {services.map((s, i) => {
            const Icon = ICONS[s.icon];
            const [c1, c2] = TINTS[s.id];
            const on = i === active;
            const bodyId = `service-${s.id}`;
            return (
              <li
                key={s.id}
                className={styles.panel}
                data-active={on || undefined}
                style={{ '--c1': c1, '--c2': c2 } as CSSProperties}
                onMouseEnter={coarsePointer ? undefined : () => setActive(i)}
              >
                <div className={styles.card}>
                  <button
                    type="button"
                    className={styles.head}
                    aria-expanded={on}
                    aria-controls={bodyId}
                    onClick={(e) => toggle(i, e.currentTarget)}
                    onFocus={(e) => {
                      if (e.currentTarget.matches(':focus-visible')) setActive(i);
                    }}
                  >
                    <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
                    <Icon className={styles.headIcon} size={26} stroke={1.6} aria-hidden="true" />
                    <span className={styles.label}>{s.title}</span>
                    <span className={styles.headPrice}>{fromPrice(s.priceFrom)}</span>
                  </button>

                  <div id={bodyId} className={styles.body} aria-hidden={!on}>
                    <div className={styles.bodyInner}>
                      <span className={styles.art} aria-hidden="true">
                        <span className={styles.ring} />
                        <Icon size={82} stroke={1.15} />
                      </span>
                      <h3 className={styles.name}>{s.title}</h3>
                      <p className={styles.text}>
                        {s.short}. {servicesSection.previewNote}
                      </p>
                      <div className={styles.foot}>
                        <span className={styles.price}>{fromPrice(s.priceFrom)}</span>
                        <span className={styles.actions}>
                          <a
                            href="#prices"
                            className={`btn-fx ${styles.ghostBtn}`}
                            tabIndex={on ? undefined : -1}
                            onClick={() => openPrices(s.id)}
                          >
                            {servicesSection.pricesLink}
                          </a>
                          <a
                            href="#contacts"
                            className={`btn-fx ${styles.primaryBtn}`}
                            tabIndex={on ? undefined : -1}
                          >
                            {servicesSection.cta}
                          </a>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
