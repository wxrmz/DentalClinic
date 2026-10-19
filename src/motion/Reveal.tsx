import { useLayoutEffect, useRef, type ElementType, type ReactNode } from 'react';
import { gsap } from './gsap';
import { useMediaFlags } from './useMediaFlags';

type RevealProps = {
  as?: ElementType;
  className?: string;
  y?: number;
  delay?: number;
  stagger?: number;
  children?: ReactNode;
};

export function Reveal({ as: Tag = 'div', className, y = 32, delay = 0, stagger = 0, children }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const { reducedMotion } = useMediaFlags();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion) return;
    const ctx = gsap.context(() => {
      const targets = stagger > 0 ? Array.from(el.children) : [el];
      if (targets.length === 0) return;
      gsap.set(targets, { opacity: 0, y });
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        delay,
        stagger: stagger > 0 ? stagger : 0,
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
    }, el);
    return () => ctx.revert();
  }, [reducedMotion, y, delay, stagger]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
