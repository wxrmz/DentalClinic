import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { gsap } from './gsap';
import { useMediaFlags } from './useMediaFlags';
import styles from './Parallax.module.css';

type ParallaxProps = {
  speed: number;
  className?: string;
  children?: ReactNode;
};

export function Parallax({ speed, className, children }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { reducedMotion, isMobile, coarsePointer } = useMediaFlags();

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion || coarsePointer || speed === 0) return;
    const factor = isMobile ? 0.5 : 1;
    const half = () => (speed * factor * (window.innerHeight + el.offsetHeight)) / 2;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y: () => -half() },
        {
          y: () => half(),
          ease: 'none',
          scrollTrigger: {
            trigger: el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
    }, el);
    return () => ctx.revert();
  }, [speed, reducedMotion, isMobile, coarsePointer]);

  return (
    <div
      ref={ref}
      className={className ? `${className} ${styles.touch}` : styles.touch}
      style={{ '--parallax-speed': speed } as CSSProperties}
    >
      {children}
    </div>
  );
}
