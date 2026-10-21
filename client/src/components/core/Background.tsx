import { useEffect, useRef } from 'react';
import { useReducedMotion } from '../../stores/uiStore';

const GRID_SIZE = 48;
const STAR_COUNT = 90;

/**
 * Fundo do sistema: grade luminosa com leve curvatura nas bordas,
 * brilho radial azul no centro, vinheta e um campo de estrelas discreto.
 */
export function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg-deep">
      <GridCanvas />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(37,99,235,0.22),transparent_60%)]" />
      <StarField />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(3,8,20,0.85)_100%)]" />
    </div>
  );
}

/** Grade desenhada uma vez (e a cada redimensionamento), com distorção de "domo" nas bordas. */
function GridCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;
      const radius = Math.hypot(cx, cy);
      const strength = 0.14;
      // Distorção em barril: pontos longe do centro são puxados levemente para dentro.
      const warp = (x: number, y: number): [number, number] => {
        const dx = (x - cx) / radius;
        const dy = (y - cy) / radius;
        const factor = 1 - strength * (dx * dx + dy * dy);
        return [cx + (x - cx) * factor, cy + (y - cy) * factor];
      };

      ctx.strokeStyle = 'rgba(56, 140, 255, 0.08)';
      ctx.lineWidth = 1;
      const span = radius * 1.25;
      const step = 12;

      for (let x = cx - Math.ceil(span / GRID_SIZE) * GRID_SIZE; x <= cx + span; x += GRID_SIZE) {
        ctx.beginPath();
        for (let y = cy - span; y <= cy + span; y += step) {
          const [px, py] = warp(x, y);
          if (y === cy - span) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      for (let y = cy - Math.ceil(span / GRID_SIZE) * GRID_SIZE; y <= cy + span; y += GRID_SIZE) {
        ctx.beginPath();
        for (let x = cx - span; x <= cx + span; x += step) {
          const [px, py] = warp(x, y);
          if (x === cx - span) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    };

    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, []);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}

interface Star {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
}

/** Poucas estrelas piscando devagar. Atualiza ~15 vezes por segundo e pausa com a aba oculta. */
function StarField() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let stars: Star[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let last = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: STAR_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.1 + 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.6 + 0.2,
      }));
    };

    const render = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      for (const star of stars) {
        const alpha = reduced
          ? 0.6
          : 0.35 + 0.45 * (0.5 + 0.5 * Math.sin((time / 1000) * star.speed + star.phase));
        ctx.beginPath();
        ctx.fillStyle = `rgba(165, 243, 252, ${alpha.toFixed(3)})`;
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = (time: number) => {
      frame = requestAnimationFrame(loop);
      if (time - last < 66) return;
      last = time;
      render(time);
    };

    const start = () => {
      cancelAnimationFrame(frame);
      if (reduced) render(0);
      else frame = requestAnimationFrame(loop);
    };

    const onVisibility = () => (document.hidden ? cancelAnimationFrame(frame) : start());
    const onResize = () => {
      resize();
      render(performance.now());
    };

    resize();
    start();
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reduced]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}
