import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { IconX } from '@tabler/icons-react';
import { calculatorText as t } from '../../content/calculator';
import { pricesSection } from '../../content/prices';
import { gsap, useMediaFlags } from '../../motion';
import { formatRub, priceLabel } from './format';
import styles from './Estimate.module.css';

export type EstimateLine = {
  key: string;
  name: string;
  price: number | null;
  from: boolean;
  qty: number;
};

const payOptions = [1, ...t.months];

const LEAVE_MS = 380;
const EMPTY_KEY = '__empty';

type Shown = (EstimateLine | { key: typeof EMPTY_KEY }) & { leaving?: boolean; still?: boolean };

const signature = (rows: { key: string; qty?: number }[]) => rows.map((r) => `${r.key}:${r.qty ?? 0}`).join('|');

function merge(prev: Shown[], target: Shown[]): Shown[] {
  const byKey = new Map(target.map((r) => [r.key, r]));
  const next: Shown[] = prev.map((p) => {
    const t = byKey.get(p.key);
    if (!t) return { ...p, leaving: true };
    return p.still ? { ...t, still: true } : t;
  });
  target.forEach((r, i) => {
    if (next.some((n) => n.key === r.key)) return;
    const after = i > 0 ? next.findIndex((n) => n.key === target[i - 1].key) : -1;
    next.splice(after + 1, 0, r);
  });
  return next;
}

type Props = {
  lines: EstimateLine[];
  total: number;
  onRemove: (key: string) => void;
};

export function Estimate({ lines, total, onRemove }: Props) {
  const [months, setMonths] = useState(1);
  const { reducedMotion } = useMediaFlags();

  const monthlyText = months > 1 && total > 0 ? `≈ ${formatRub(total / months)} ${t.perMonth}` : null;
  const [lastMonthly, setLastMonthly] = useState({ months, text: monthlyText ?? '' });
  if (monthlyText && monthlyText !== lastMonthly.text) setLastMonthly({ months, text: monthlyText });

  const target: Shown[] = lines.length ? lines : [{ key: EMPTY_KEY }];
  const sig = signature(target as { key: string; qty?: number }[]);
  const [rows, setRows] = useState<Shown[]>(() => target.map((r) => ({ ...r, still: true })));
  const [prevSig, setPrevSig] = useState(sig);
  if (sig !== prevSig) {
    setPrevSig(sig);
    setRows((cur) => (reducedMotion ? target : merge(cur, target)));
  }
  useEffect(() => {
    if (!rows.some((r) => r.leaving)) return;
    const id = window.setTimeout(() => setRows((cur) => cur.filter((r) => !r.leaving)), LEAVE_MS);
    return () => window.clearTimeout(id);
  }, [rows]);

  const totalRef = useRef<HTMLSpanElement>(null);
  const shown = useRef({ value: total });
  useLayoutEffect(() => {
    const el = totalRef.current;
    if (!el) return;
    const obj = shown.current;
    const render = () => {
      el.textContent = formatRub(obj.value);
    };
    if (reducedMotion) {
      gsap.killTweensOf(obj);
      obj.value = total;
      render();
      return;
    }
    render();
    const tween = gsap.to(obj, { value: total, duration: 0.6, ease: 'power3.out', onUpdate: render, onComplete: render });
    return () => {
      tween.kill();
    };
  }, [total, reducedMotion]);

  return (
    <div id="estimate" className={styles.calc}>
      <h3 className={styles.title}>{t.title}</h3>

      <div className={styles.receipt}>
        <div className={styles.receiptHead}>
          <span>{t.receiptTitle}</span>
          <span>№ 0427</span>
        </div>
        <ul className={styles.lines} aria-live="polite">
          {rows.map((r) => (
            <li
              key={r.key}
              className={styles.lineWrap}
              data-leaving={r.leaving || undefined}
              data-still={r.still || undefined}
              inert={r.leaving}
            >
              <div className={styles.lineClip}>
                {'name' in r ? (
                  <div className={styles.line}>
                    <span className={styles.lineName}>
                      {r.name}
                      {r.qty > 1 && <span className={styles.lineQty}> × {r.qty}</span>}
                    </span>
                    <span key={r.qty} className={r.price === null ? styles.lineFree : styles.lineSum}>
                      {priceLabel(r, r.qty)}
                    </span>
                    <button
                      type="button"
                      className={styles.remove}
                      aria-label={`${t.remove}: ${r.name}`}
                      onClick={() => onRemove(r.key)}
                    >
                      <IconX size={16} stroke={2} />
                    </button>
                  </div>
                ) : (
                  <p className={styles.empty}>{t.empty}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>{t.total}</span>
          <span ref={totalRef} className={styles.total} />
        </div>
        <div
          className={styles.seg}
          role="radiogroup"
          aria-label={t.paymentLabel}
          style={{ '--n': payOptions.length, '--i': payOptions.indexOf(months) } as CSSProperties}
        >
          <span className={styles.segThumb} aria-hidden="true" />
          {payOptions.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={months === m}
              className={styles.segBtn}
              data-on={months === m || undefined}
              onClick={() => setMonths(m)}
            >
              {m === 1 ? t.payNow : `${m} ${t.monthsSuffix}`}
            </button>
          ))}
        </div>
        <div className={styles.monthlyWrap} data-open={monthlyText ? true : undefined}>
          <div className={styles.monthlyClip}>
            <p className={styles.monthly} aria-live="polite">
              <span key={lastMonthly.months} className={styles.monthlyValue}>
                {lastMonthly.text}
              </span>
            </p>
          </div>
        </div>
      </div>

      <a href="#contacts" className={`btn-fx ${styles.cta}`}>
        {t.cta}
      </a>
      <p className={styles.note}>{pricesSection.note}</p>
    </div>
  );
}
