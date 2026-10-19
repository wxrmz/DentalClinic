import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { IconMinus, IconPlus, IconSearch, IconX } from '@tabler/icons-react';
import { calculatorText as t } from '../../content/calculator';
import { priceCategories, pricesSection } from '../../content/prices';
import type { PriceCategory } from '../../content/types';
import { gsap, Reveal, ScrollTrigger, useMediaFlags } from '../../motion';
import { Estimate, type EstimateLine } from './Estimate';
import { formatRub, plural, priceLabel } from './format';
import styles from './index.module.css';

type Filter = 'all' | PriceCategory['id'];
const MAX_QTY = 9;
const CLOSE_MS = 300;

const ENTRIES = priceCategories.flatMap((cat) =>
  cat.items.map((item, i) => ({ key: `${cat.id}:${i}`, cat, item })),
);
type Entry = (typeof ENTRIES)[number];

const without = <T,>(o: Record<string, T>, key: string) => {
  const next = { ...o };
  delete next[key];
  return next;
};

const normalize = (s: string) => s.toLowerCase().replace(/ё/g, 'е').trim();

function highlight(text: string, q: string): ReactNode {
  if (!q) return text;
  const i = normalize(text).indexOf(q);
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

function centerChip(box: HTMLElement | null, chip: HTMLElement) {
  if (!box || box.scrollWidth <= box.clientWidth) return;
  box.scrollTo({ left: chip.offsetLeft - (box.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
}

export default function Prices() {
  const [filter, setFilter] = useState<Filter>(priceCategories[0]?.id ?? 'all');
  const [query, setQuery] = useState('');
  const [qty, setQty] = useState<Record<string, number>>(() =>
    Object.fromEntries(ENTRIES.filter((e) => e.item.preset).map((e) => [e.key, e.item.preset ?? 0])),
  );

  useEffect(() => {
    const onOpen = (e: Event) => {
      const id = (e as CustomEvent<unknown>).detail;
      const cat = priceCategories.find((c) => c.id === id);
      if (!cat) return;
      setQuery('');
      setFilter(cat.id);
    };
    window.addEventListener('prices:open', onOpen);
    return () => window.removeEventListener('prices:open', onOpen);
  }, []);

  const q = normalize(query);
  const { reducedMotion } = useMediaFlags();
  const chipsRef = useRef<HTMLDivElement>(null);
  const listWrapRef = useRef<HTMLDivElement>(null);
  const fromHeight = useRef<number | null>(null);
  const switchCtx = useRef<gsap.Context | null>(null);

  const selectCategory = (id: Filter, chip: HTMLElement) => {
    if (!q && id === filter) return;
    centerChip(chipsRef.current, chip);
    if (!reducedMotion && listWrapRef.current) fromHeight.current = listWrapRef.current.offsetHeight;
    setQuery('');
    setFilter(id);
  };

  const groups = useMemo(() => {
    const match = (e: Entry) =>
      q ? normalize(e.item.name).includes(q) || normalize(e.cat.title).includes(q) : filter === 'all' || e.cat.id === filter;
    return priceCategories
      .map((cat) => ({ cat, entries: ENTRIES.filter((e) => e.cat === cat && match(e)) }))
      .filter((g) => g.entries.length > 0);
  }, [q, filter]);
  const showGroupTitles = q !== '' || filter === 'all';

  useLayoutEffect(() => {
    const wrap = listWrapRef.current;
    const from = fromHeight.current;
    if (!wrap || from === null) return;
    fromHeight.current = null;
    const to = wrap.offsetHeight;
    switchCtx.current ??= gsap.context(() => {});
    switchCtx.current.add(() =>
      gsap.fromTo(
        wrap,
        { height: from, overflow: 'hidden' },
        {
          height: to,
          duration: 0.4,
          ease: 'power2.out',
          clearProps: 'height,overflow',
          onComplete: () => ScrollTrigger.refresh(),
        },
      ),
    );
  }, [filter, q]);
  useEffect(() => () => switchCtx.current?.revert(), []);

  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 500);
    return () => window.clearTimeout(id);
  }, [groups]);

  const [change, setChange] = useState<{ key: string; dir: 'up' | 'down' } | null>(null);
  const focusNext = useRef<{ key: string; target: 'add' | 'plus' } | null>(null);
  const [closing, setClosing] = useState<Record<string, true>>({});
  const closeTimers = useRef<Record<string, number>>({});
  useEffect(() => {
    const timers = closeTimers.current;
    return () => Object.values(timers).forEach((id) => window.clearTimeout(id));
  }, []);

  const setItem = (key: string, n: number, max = MAX_QTY) => {
    const prevN = qty[key] ?? 0;
    const v = Math.min(max, Math.max(0, n));
    if (v === prevN) return;
    snapshotPrices();
    setChange({ key, dir: v > prevN ? 'up' : 'down' });
    if (prevN === 0) focusNext.current = { key, target: 'plus' };
    else if (v === 0) focusNext.current = { key, target: 'add' };
    window.clearTimeout(closeTimers.current[key]);
    if (v === 0) {
      setClosing((c) => ({ ...c, [key]: true }));
      closeTimers.current[key] = window.setTimeout(() => setClosing((c) => without(c, key)), CLOSE_MS);
    } else if (closing[key]) {
      setClosing((c) => without(c, key));
    }
    setQty((prev) => {
      const next = { ...prev };
      if (v === 0) delete next[key];
      else next[key] = v;
      return next;
    });
  };
  const prices = useRef(new Map<string, HTMLElement>());
  const flipFrom = useRef<Map<string, number> | null>(null);
  const flipCtx = useRef<gsap.Context | null>(null);
  const priceRef = (key: string) => (el: HTMLElement | null) => {
    if (el) prices.current.set(key, el);
  };
  const snapshotPrices = () => {
    const from = new Map<string, number>();
    prices.current.forEach((el, key) => {
      if (el.isConnected) from.set(key, el.getBoundingClientRect().left);
    });
    flipFrom.current = from;
  };
  useLayoutEffect(() => {
    const from = flipFrom.current;
    if (!from) return;
    flipFrom.current = null;
    if (reducedMotion) return;
    flipCtx.current ??= gsap.context(() => {});
    from.forEach((before, key) => {
      const el = prices.current.get(key);
      if (!el?.isConnected) return;
      const after = el.getBoundingClientRect().left - Number(gsap.getProperty(el, 'x'));
      const dx = before - after;
      if (Math.abs(dx) < 0.5) return;
      flipCtx.current?.add(() =>
        gsap.fromTo(el, { x: dx }, { x: 0, duration: 0.45, ease: 'power3.out', overwrite: true }),
      );
    });
  });
  useEffect(() => () => flipCtx.current?.revert(), []);

  const focusRef = (key: string, target: 'add' | 'plus') => (el: HTMLButtonElement | null) => {
    const f = focusNext.current;
    if (el && f && f.key === key && f.target === target) {
      focusNext.current = null;
      el.focus({ preventScroll: true });
    }
  };

  const lines: EstimateLine[] = ENTRIES.filter((e) => (qty[e.key] ?? 0) > 0).map((e) => ({
    key: e.key,
    name: e.item.name,
    price: e.item.price,
    from: e.item.from ?? false,
    qty: qty[e.key] ?? 0,
  }));
  const total = lines.reduce((sum, l) => sum + (l.price ?? 0) * l.qty, 0);
  const count = lines.reduce((sum, l) => sum + l.qty, 0);

  const renderPill = (key: string, name: string, n: number, max: number, closingPill: boolean) => (
    <span
      key={closingPill ? 'closing' : 'pill'}
      className={styles.stepper}
      data-closing={closingPill || undefined}
      inert={closingPill}
      aria-hidden={closingPill || undefined}
    >
      <button
        type="button"
        className={styles.step}
        aria-label={`${t.remove}: ${name}`}
        onClick={() => setItem(key, n - 1, max)}
      >
        <IconMinus size={16} stroke={2.2} />
      </button>
      <span className={styles.qtyWindow} aria-live={closingPill ? undefined : 'polite'}>
        <span
          key={n}
          className={styles.qty}
          data-dir={change?.key === key && !closingPill ? change.dir : undefined}
        >
          {n}
        </span>
      </span>
      <button
        ref={closingPill ? undefined : focusRef(key, 'plus')}
        type="button"
        className={styles.step}
        aria-label={`${t.add}: ${name}`}
        disabled={n >= max}
        onClick={() => setItem(key, n + 1, max)}
      >
        <IconPlus size={16} stroke={2.2} />
      </button>
    </span>
  );

  let rowIndex = 0;

  return (
    <section id="prices" className={styles.root}>
      <div className="container">
        <Reveal className={styles.head}>
          <p className="eyebrow">{pricesSection.eyebrow}</p>
          <h2 className={styles.title}>{pricesSection.title}</h2>
        </Reveal>

        <div className={styles.layout}>
          <div className={styles.catalog}>
            <label className={styles.search}>
              <span className="sr-only">{t.searchLabel}</span>
              <IconSearch className={styles.searchIcon} size={22} stroke={1.8} aria-hidden="true" />
              <input
                type="search"
                className={styles.searchInput}
                placeholder={t.searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button type="button" className={styles.clear} aria-label={t.clear} onClick={() => setQuery('')}>
                  <IconX size={16} stroke={2} />
                </button>
              )}
            </label>

            <div ref={chipsRef} className={styles.chips} role="group" aria-label={pricesSection.eyebrow}>
              {[{ id: 'all' as const, title: t.all }, ...priceCategories].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={styles.chip}
                  aria-pressed={!q && filter === c.id}
                  data-on={(!q && filter === c.id) || undefined}
                  onClick={(e) => selectCategory(c.id, e.currentTarget)}
                >
                  {c.title}
                </button>
              ))}
            </div>

            <div ref={listWrapRef} className={styles.listWrap}>
              <div key={`${filter}|${q}`} className={styles.list} aria-live="polite">
                {groups.length === 0 && <p className={styles.notFound}>{t.notFound}</p>}
                {groups.map(({ cat, entries }) => (
                  <Fragment key={cat.id}>
                    {showGroupTitles && <h3 className={styles.groupTitle}>{highlight(cat.title, q)}</h3>}
                    <ul className={styles.rows}>
                      {entries.map(({ key, item }) => {
                        const n = qty[key] ?? 0;
                        const isClosing = n === 0 && Boolean(closing[key]);
                        const max = item.price === null ? 1 : MAX_QTY;
                        return (
                          <li
                            key={key}
                            className={styles.row}
                            data-on={n > 0 || undefined}
                            style={{ '--i': Math.min(rowIndex++, 8) } as CSSProperties}
                          >
                            <span className={styles.rowName} data-picked={n > 0 || undefined}>
                              <span className={styles.nameRegular}>{highlight(item.name, q)}</span>
                              <span className={styles.nameBold} aria-hidden="true">
                                {highlight(item.name, q)}
                              </span>
                            </span>
                            <span ref={priceRef(key)} className={item.price === null ? styles.free : styles.price}>
                              {priceLabel(item)}
                            </span>
                            <span className={styles.control}>
                              {n > 0 ? (
                                renderPill(key, item.name, n, max, false)
                              ) : (
                                <button
                                  ref={focusRef(key, 'add')}
                                  type="button"
                                  className={styles.add}
                                  data-back={change?.key === key || undefined}
                                  aria-label={`${t.add}: ${item.name}`}
                                  onClick={() => setItem(key, 1, max)}
                                >
                                  <IconPlus size={18} stroke={2} />
                                </button>
                              )}
                              {isClosing && renderPill(key, item.name, 1, max, true)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </Fragment>
                ))}
              </div>
            </div>

            {count > 0 && (
              <a href="#estimate" className={styles.bar}>
                <span>
                  {t.toEstimate} · {count} {plural(count, t.itemForms)}
                </span>
                <span className={styles.barTotal}>{formatRub(total)}</span>
              </a>
            )}
          </div>

          <div className={styles.aside}>
            <Estimate lines={lines} total={total} onRemove={(key) => setItem(key, 0)} />
          </div>
        </div>
      </div>
    </section>
  );
}
