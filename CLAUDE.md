# Мята — лендинг стоматологии

Stack: Vite + React + TypeScript (strict), GSAP + ScrollTrigger, Lenis, raw WebGL1 SDF shaders (no three.js), CSS Modules.

## Commands
- `npm run dev` — dev server
- `npm run build` — production build (must pass)
- `npm run lint` — ESLint (must pass)
- `npm run typecheck` — `tsc --noEmit` (must pass)

## Conventions
- Spec is the source of truth: `docs/SPEC.md`. Navigation: `filemap.md` — update it when you add or move files.
- All user-facing copy is Russian and lives in `src/content/*`; components never hardcode copy or prices.
- Colors, radii, spacing only via CSS variables from `src/styles/tokens.css`. Small text never uses `--mint` (#2FB592); use `--mint-text`.
- Animate only `transform`/`opacity`. Every GSAP animation/ScrollTrigger is created inside a `gsap.context` and reverted on unmount.
- Respect `useMediaFlags()`: reduced motion → no smooth scroll/parallax/rotation; coarse pointer → no cursor parallax and no JS (GSAP) scroll-linked transforms (they lag native touch scrolling and jerk); touch parallax only as CSS scroll-driven animations (`animation-timeline`).
- WebGL only through `src/gl/ShaderCanvas.tsx` (handles DPR cap, offscreen pause, fallback).
- Each section lives in `src/sections/<Name>/` and touches only its own folder plus shared code it was asked to create.
