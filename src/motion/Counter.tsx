import { useLayoutEffect, useMemo, useRef } from 'react';
import { gsap } from './gsap';
import { useMediaFlags } from './useMediaFlags';

type CounterProps = {
  value: number;
  suffix?: string;
  decimals?: number;
  className?: string;
  immediate?: boolean;
  delay?: number;
};

const DURATION = 1.6;

export function Counter({
  value,
  suffix = '',
  decimals = 0,
  className,
  immediate = false,
  delay = 0,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const { reducedMotion } = useMediaFlags();

  const format = useMemo(() => {
    const nf = new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return (n: number) => `${nf.format(n).replace(/[\u00A0\u202F]/g, '\u202F')}${suffix}`;
  }, [suffix, decimals]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion) {
      el.textContent = format(value);
      return;
    }
    const state = { n: 0 };
    el.textContent = format(0);
    const ctx = gsap.context(() => {
      gsap.to(state, {
        n: value,
        duration: DURATION,
        ease: 'power3.out',
        onUpdate: () => {
          el.textContent = format(state.n);
        },
        delay: immediate ? delay : 0,
        scrollTrigger: immediate ? undefined : { trigger: el, start: 'top 85%', once: true },
      });
    }, el);
    return () => {
      ctx.revert();
      el.textContent = format(value);
    };
  }, [value, format, reducedMotion, immediate, delay]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {format(value)}
    </span>
  );
}
