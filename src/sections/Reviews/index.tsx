import { useEffect, useRef, type CSSProperties } from 'react';
import { IconStarFilled } from '@tabler/icons-react';
import { clinic } from '../../content/clinic';
import { reviews, reviewsSummary } from '../../content/reviews';
import type { Review } from '../../content/types';
import { Reveal, useMediaFlags } from '../../motion';
import styles from './index.module.css';

const AVATAR_TINTS = ['#DDF3EC', '#DCEFF6', '#E6F3DC'];
const ratingText = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1 }).format(
  clinic.rating,
);

const half = Math.ceil(reviews.length / 2);
const rows: { items: Review[]; offset: number; reverse: boolean; duration: number }[] = [
  { items: reviews.slice(0, half), offset: 0, reverse: false, duration: 46 },
  { items: reviews.slice(half), offset: half, reverse: true, duration: 54 },
];

function Card({ r, tint }: { r: Review; tint: string }) {
  return (
    <figure className={styles.card}>
      <div className={styles.stars} aria-label={`${r.rating} из 5`}>
        {Array.from({ length: 5 }, (_, i) => (
          <IconStarFilled key={i} size={14} aria-hidden="true" />
        ))}
      </div>
      <blockquote className={styles.text}>{r.text}</blockquote>
      <figcaption className={styles.who}>
        <span className={styles.avatar} style={{ background: tint }} aria-hidden="true">
          {r.initials}
        </span>
        <span className={styles.name}>{r.name}</span>
        <span className={styles.source}>{r.source}</span>
      </figcaption>
    </figure>
  );
}

const FRICTION = 0.9965;
const MIN_FLING = 0.03;
const RESUME_DELAY = 350;
const RESUME_RAMP = 900;
const TAP_SLOP = 10;
const CENTER_MS = 650;

const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

type RowControl = { detach: () => void; deselect: () => void; contains: (n: Node) => boolean };

function attachRow(
  marquee: HTMLElement,
  slide: HTMLElement,
  track: HTMLElement,
  onSelect: () => void,
): RowControl {
  const anim = track.getAnimations()[0];
  if (!anim) return { detach: () => {}, deselect: () => {}, contains: () => false };
  const duration = Number(anim.effect?.getTiming().duration) || 1;
  const reverse = track.hasAttribute('data-reverse');
  let width = 1;
  let drift = 0;
  let base = 0;
  let x = 0;
  let pointer: number | null = null;
  let startX = 0;
  let lastX = 0;
  let moved = false;
  let samples: { t: number; x: number }[] = [];
  let raf = 0;
  let timer = 0;
  let active = false;
  let hovered = false;
  let downCard: HTMLElement | null = null;
  let selected: HTMLElement[] = [];

  const stopMotion = () => {
    cancelAnimationFrame(raf);
    window.clearTimeout(timer);
  };
  const wrap = () => {
    const c = base + x;
    x = (((c % width) - width) % width) - base;
  };
  const render = () => {
    wrap();
    slide.style.transform = `translate3d(${x}px, 0, 0)`;
  };
  const takeOver = () => {
    if (active) return;
    anim.pause();
    width = track.scrollWidth / 2 || 1;
    drift = ((reverse ? 1 : -1) * width) / duration;
    base = new DOMMatrix(getComputedStyle(track).transform).m41;
    x = 0;
    active = true;
  };
  const handOff = () => {
    wrap();
    const c = base + x;
    const p = reverse ? 1 + c / width : -c / width;
    anim.currentTime = (((p % 1) + 1) % 1) * duration;
    slide.style.transform = '';
    x = 0;
    active = false;
    anim.play();
  };
  const rampTo = (v0: number, delay: number) => {
    timer = window.setTimeout(() => {
      let start = 0;
      let prev = 0;
      const step = (now: number) => {
        if (!start) start = prev = now;
        const dt = Math.min(48, now - prev);
        prev = now;
        const k = Math.min(1, (now - start) / RESUME_RAMP);
        const e = k * k * (3 - 2 * k);
        x += (v0 + (drift - v0) * e) * dt;
        render();
        if (k < 1) raf = requestAnimationFrame(step);
        else handOff();
      };
      raf = requestAnimationFrame(step);
    }, delay);
  };
  const resume = (v0: number, delay: number) => {
    if (!hovered) rampTo(v0, delay);
  };
  const fling = (v0: number) => {
    let v = v0;
    let prev = performance.now();
    const step = (now: number) => {
      const dt = Math.min(48, now - prev);
      prev = now;
      v *= Math.pow(FRICTION, dt);
      x += v * dt;
      render();
      if (Math.sign(v) === Math.sign(drift) && Math.abs(v) <= Math.abs(drift)) resume(v, 0);
      else if (Math.abs(v) > MIN_FLING) raf = requestAnimationFrame(step);
      else resume(0, RESUME_DELAY);
    };
    raf = requestAnimationFrame(step);
  };

  const clearSelection = () => {
    selected.forEach((c) => c.removeAttribute('data-selected'));
    selected = [];
    marquee.removeAttribute('data-focus');
  };
  const select = (card: HTMLElement) => {
    onSelect();
    clearSelection();
    const group = card.parentElement;
    const idx = group ? Array.prototype.indexOf.call(group.children, card) : -1;
    selected = Array.from(track.children)
      .map((g) => g.children[idx])
      .filter((c): c is HTMLElement => c instanceof HTMLElement);
    selected.forEach((c) => c.setAttribute('data-selected', ''));
    marquee.setAttribute('data-focus', '');
    const r = card.getBoundingClientRect();
    const m = marquee.getBoundingClientRect();
    const from = x;
    const delta = m.left + m.width / 2 - (r.left + r.width / 2);
    let start = 0;
    const step = (now: number) => {
      if (!start) start = now;
      const k = Math.min(1, (now - start) / CENTER_MS);
      x = from + delta * easeInOut(k);
      render();
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };
  const deselect = () => {
    if (!selected.length) return;
    clearSelection();
    if (active && pointer === null) {
      stopMotion();
      resume(0, 150);
    }
  };

  const onDown = (e: PointerEvent) => {
    if (pointer !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
    if (e.pointerType === 'mouse') e.preventDefault();
    stopMotion();
    takeOver();
    pointer = e.pointerId;
    const card = (e.target as Element | null)?.closest('figure');
    downCard = card instanceof HTMLElement && track.contains(card) ? card : null;
    startX = lastX = e.clientX;
    moved = false;
    samples = [{ t: e.timeStamp, x: e.clientX }];
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerId !== pointer) return;
    if (!moved && Math.abs(e.clientX - startX) > TAP_SLOP) {
      moved = true;
      marquee.setPointerCapture(e.pointerId);
      clearSelection();
    }
    x += e.clientX - lastX;
    lastX = e.clientX;
    samples.push({ t: e.timeStamp, x: e.clientX });
    while (samples.length > 2 && e.timeStamp - samples[0].t > 100) samples.shift();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(render);
  };
  const onUp = (e: PointerEvent) => {
    if (e.pointerId !== pointer) return;
    pointer = null;
    cancelAnimationFrame(raf);
    render();
    if (e.type === 'pointerup' && !moved && downCard) {
      if (downCard.hasAttribute('data-selected')) deselect();
      else select(downCard);
      return;
    }
    if (selected.length) return;
    const first = samples[0];
    const last = samples[samples.length - 1];
    const dt = last.t - first.t;
    const v =
      e.type === 'pointerup' && dt > 0 && e.timeStamp - last.t < 80 ? (last.x - first.x) / dt : 0;
    if (Math.abs(v) > MIN_FLING) fling(v);
    else resume(0, RESUME_DELAY);
  };
  const onEnter = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    hovered = true;
    if (pointer !== null) return;
    stopMotion();
    takeOver();
  };
  const onLeave = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    hovered = false;
    if (pointer !== null || selected.length || !active) return;
    stopMotion();
    rampTo(0, 0);
  };

  marquee.addEventListener('pointerdown', onDown);
  marquee.addEventListener('pointermove', onMove);
  marquee.addEventListener('pointerup', onUp);
  marquee.addEventListener('pointercancel', onUp);
  marquee.addEventListener('pointerenter', onEnter);
  marquee.addEventListener('pointerleave', onLeave);
  return {
    deselect,
    contains: (n) => marquee.contains(n),
    detach: () => {
      stopMotion();
      clearSelection();
      marquee.removeEventListener('pointerdown', onDown);
      marquee.removeEventListener('pointermove', onMove);
      marquee.removeEventListener('pointerup', onUp);
      marquee.removeEventListener('pointercancel', onUp);
      marquee.removeEventListener('pointerenter', onEnter);
      marquee.removeEventListener('pointerleave', onLeave);
      slide.style.transform = '';
      anim.play();
    },
  };
}

export default function Reviews() {
  const rowsRef = useRef<HTMLDivElement>(null);
  const { reducedMotion } = useMediaFlags();

  useEffect(() => {
    const rowsEl = rowsRef.current;
    if (!rowsEl || reducedMotion) return;
    const controls: RowControl[] = [];
    Array.from(rowsEl.children).forEach((m) => {
      const slide = m.firstElementChild;
      const track = slide?.firstElementChild;
      if (
        m instanceof HTMLElement &&
        slide instanceof HTMLElement &&
        track instanceof HTMLElement
      ) {
        const row = attachRow(m, slide, track, () =>
          controls.forEach((c) => c !== row && c.deselect()),
        );
        controls.push(row);
      }
    });
    const onDocDown = (e: PointerEvent) => {
      const t = e.target;
      if (t instanceof Node) controls.forEach((c) => !c.contains(t) && c.deselect());
    };
    document.addEventListener('pointerdown', onDocDown, true);
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) controls.forEach((c) => c.deselect());
    });
    io.observe(rowsEl);
    return () => {
      document.removeEventListener('pointerdown', onDocDown, true);
      io.disconnect();
      controls.forEach((c) => c.detach());
    };
  }, [reducedMotion]);

  return (
    <section id="reviews" className={styles.root}>
      <div className="container">
        <Reveal className={styles.head}>
          <span className={styles.score}>
            <IconStarFilled className={styles.scoreStar} aria-hidden="true" />
            {ratingText}
          </span>
          <div className={styles.headText}>
            <h2 className={styles.title}>{reviewsSummary.count}</h2>
            <ul className={styles.sources}>
              {reviewsSummary.sources.map((s) => (
                <li key={s.name} className={styles.sourceChip}>
                  <IconStarFilled size={14} aria-hidden="true" />
                  {s.name} · {s.rating}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>

      <div ref={rowsRef} className={styles.rows}>
        {rows.map((row, ri) => (
          <div key={ri} className={styles.marquee}>
            <div className={styles.slide}>
              <div
                className={styles.track}
                data-reverse={row.reverse || undefined}
                style={{ '--dur': `${row.duration}s` } as CSSProperties}
              >
                {[0, 1].map((copy) => (
                  <div key={copy} className={styles.group} aria-hidden={copy === 1 || undefined}>
                    {row.items.map((r, i) => (
                      <Card
                        key={r.name}
                        r={r}
                        tint={AVATAR_TINTS[(row.offset + i) % AVATAR_TINTS.length]}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
