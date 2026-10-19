import { useEffect, useRef, type RefObject } from 'react';
import { gsap } from './gsap';
import { useMediaFlags } from './useMediaFlags';

const LERP = 0.07;
const clamp = (v: number) => Math.max(-0.5, Math.min(0.5, v));

export function usePointer(target?: RefObject<HTMLElement | null>): RefObject<{ x: number; y: number }> {
  const value = useRef({ x: 0, y: 0 });
  const { coarsePointer, reducedMotion } = useMediaFlags();

  useEffect(() => {
    const v = value.current;
    if (coarsePointer || reducedMotion) {
      v.x = 0;
      v.y = 0;
      return;
    }
    const goal = { x: 0, y: 0 };
    const el = target?.current ?? null;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        goal.x = clamp((e.clientX - r.left) / r.width - 0.5);
        goal.y = clamp((e.clientY - r.top) / r.height - 0.5);
      } else {
        goal.x = clamp(e.clientX / window.innerWidth - 0.5);
        goal.y = clamp(e.clientY / window.innerHeight - 0.5);
      }
    };
    const onLeave = () => {
      goal.x = 0;
      goal.y = 0;
    };
    const tick = () => {
      const dx = goal.x - v.x;
      const dy = goal.y - v.y;
      v.x = Math.abs(dx) < 1e-4 ? goal.x : v.x + dx * LERP;
      v.y = Math.abs(dy) < 1e-4 ? goal.y : v.y + dy * LERP;
    };

    const moveTarget: HTMLElement | Window = el ?? window;
    const leaveTarget: HTMLElement = el ?? document.documentElement;
    moveTarget.addEventListener('pointermove', onMove as EventListener, { passive: true });
    leaveTarget.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    gsap.ticker.add(tick);
    return () => {
      moveTarget.removeEventListener('pointermove', onMove as EventListener);
      leaveTarget.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      gsap.ticker.remove(tick);
      v.x = 0;
      v.y = 0;
    };
  }, [target, coarsePointer, reducedMotion]);

  return value;
}
