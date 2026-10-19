import { useEffect, useRef, useState } from 'react';
import { useMediaFlags } from '../motion/useMediaFlags';

export type UniformValue = number | readonly [number, number];
export type UniformMap = Record<string, UniformValue>;

type ShaderCanvasProps = {
  fragment: string;
  getUniforms: (time: number) => UniformMap;
  dprCap?: number;
  maxFps?: number;
  minScale?: number;
  className?: string;
  onReady?: () => void;
  onError?: (e: string) => void;
};

const VERTEX = 'attribute vec2 p; void main(){gl_Position=vec4(p,0.,1.);}';

const pendingLose = new WeakMap<HTMLCanvasElement, number>();

export function ShaderCanvas({
  fragment,
  getUniforms,
  dprCap = 1.5,
  maxFps = 60,
  minScale = 0.6,
  className,
  onReady,
  onError,
}: ShaderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const { reducedMotion, coarsePointer } = useMediaFlags();

  const getUniformsRef = useRef(getUniforms);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    getUniformsRef.current = getUniforms;
    onReadyRef.current = onReady;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    const cleanups: Array<() => void> = [];
    const dispose = () => {
      if (disposed) return;
      disposed = true;
      for (let i = cleanups.length - 1; i >= 0; i--) cleanups[i]();
    };
    const fail = (msg: string) => {
      if (disposed) return;
      if (import.meta.env.DEV) console.error('[ShaderCanvas]', msg);
      dispose();
      onErrorRef.current?.(msg);
      setFailed(true);
    };

    const pending = pendingLose.get(canvas);
    if (pending !== undefined) {
      clearTimeout(pending);
      pendingLose.delete(canvas);
    }

    const gl = canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
    }) as WebGLRenderingContext | null;
    if (!gl || gl.isContextLost()) {
      queueMicrotask(() => fail('WebGL is unavailable'));
      return dispose;
    }
    cleanups.push(() => {
      const id = window.setTimeout(() => {
        pendingLose.delete(canvas);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }, 0);
      pendingLose.set(canvas, id);
    });

    const compile = (type: number, src: string): WebGLShader | string => {
      const sh = gl.createShader(type);
      if (!sh) return 'createShader failed';
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(sh) ?? 'unknown compile error';
        gl.deleteShader(sh);
        return log;
      }
      cleanups.push(() => gl.deleteShader(sh));
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl.FRAGMENT_SHADER, fragment);
    if (typeof vs === 'string' || typeof fs === 'string') {
      const log = typeof vs === 'string' ? `vertex: ${vs}` : `fragment: ${fs as string}`;
      queueMicrotask(() => fail(`shader compile error — ${log}`));
      return dispose;
    }
    const prog = gl.createProgram();
    if (!prog) {
      queueMicrotask(() => fail('createProgram failed'));
      return dispose;
    }
    cleanups.push(() => gl.deleteProgram(prog));
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(prog) ?? 'unknown link error';
      queueMicrotask(() => fail(`program link error — ${log}`));
      return dispose;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    cleanups.push(() => gl.deleteBuffer(buf));
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aP = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(aP);
    gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);

    const locs = new Map<string, WebGLUniformLocation | null>();
    const loc = (name: string) => {
      if (!locs.has(name)) locs.set(name, gl.getUniformLocation(prog, name));
      return locs.get(name) ?? null;
    };

    const dpr = () =>
      Math.min(window.devicePixelRatio || 1, coarsePointer ? Math.min(dprCap, 1.25) : dprCap);
    let scale = 1;
    const resize = () => {
      const ratio = dpr() * scale;
      const w = Math.max(0, Math.round(canvas.clientWidth * ratio));
      const h = Math.max(0, Math.round(canvas.clientHeight * ratio));
      if (w !== canvas.width || h !== canvas.height) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    const t0 = performance.now();
    const now = () => (reducedMotion ? 0 : (performance.now() - t0) / 1000);
    let ready = false;

    const draw = (time: number) => {
      if (disposed || canvas.width === 0 || canvas.height === 0) return;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      const r = loc('R');
      if (r) gl.uniform2f(r, canvas.width, canvas.height);
      const uniforms = getUniformsRef.current(time);
      for (const name in uniforms) {
        const l = loc(name);
        if (!l) continue;
        const v = uniforms[name];
        if (typeof v === 'number') gl.uniform1f(l, v);
        else gl.uniform2f(l, v[0], v[1]);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!ready) {
        ready = true;
        onReadyRef.current?.();
      }
    };

    let raf = 0;
    let inView = false;
    const minGap = 1000 / maxFps - 2;
    let lastDraw = 0;
    const WINDOW = 45;
    let winStart = 0;
    let winFrames = 0;
    let steady = 0;
    const adapt = (ts: number) => {
      if (minScale >= 1) return;
      if (winFrames === 0) winStart = ts;
      if (++winFrames < WINDOW) return;
      const avg = (ts - winStart) / (WINDOW - 1);
      winFrames = 0;
      const target = 1000 / maxFps;
      if (avg > target * 1.3 && scale > minScale) {
        scale = Math.max(minScale, scale * 0.85);
        steady = 0;
        resize();
      } else if (avg < target * 1.08 && scale < 1 && ++steady >= 3) {
        scale = Math.min(1, scale / 0.9);
        steady = 0;
        resize();
      }
    };
    const frame = (ts: number) => {
      raf = requestAnimationFrame(frame);
      if (ts - lastDraw < minGap) return;
      if (ts - lastDraw > 250) winFrames = 0;
      lastDraw = ts;
      adapt(ts);
      draw(now());
    };
    const update = () => {
      const run = !disposed && !reducedMotion && inView && document.visibilityState === 'visible';
      if (run && !raf) raf = requestAnimationFrame(frame);
      else if (!run && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    cleanups.push(() => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    });

    const io = new IntersectionObserver(
      (entries) => {
        inView = entries[entries.length - 1]?.isIntersecting ?? false;
        update();
      },
      { rootMargin: '100px' },
    );
    io.observe(canvas);
    cleanups.push(() => io.disconnect());

    const ro = new ResizeObserver(() => {
      resize();
      draw(now());
    });
    ro.observe(canvas);
    cleanups.push(() => ro.disconnect());

    document.addEventListener('visibilitychange', update);
    cleanups.push(() => document.removeEventListener('visibilitychange', update));

    const onLost = (e: Event) => {
      e.preventDefault();
      fail('WebGL context lost');
    };
    canvas.addEventListener('webglcontextlost', onLost);
    cleanups.push(() => canvas.removeEventListener('webglcontextlost', onLost));

    return dispose;
  }, [fragment, dprCap, maxFps, minScale, reducedMotion, coarsePointer]);

  if (failed) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}
