import { useEffect, useRef } from 'react';
import { cn } from '../../lib/cn';
import { useAppearanceStore, useReducedMotion, type NucleusState } from '../../stores/uiStore';

/** Parâmetros de cada estado: velocidade de giro e intensidade do brilho. */
const STATE_PARAMS: Record<NucleusState, { speed: number; glow: number }> = {
  ocioso: { speed: 1, glow: 1 },
  processando: { speed: 2.8, glow: 1.55 },
  ouvindo: { speed: 1.4, glow: 1.25 },
  falando: { speed: 1.8, glow: 1.35 },
};

interface Ring {
  radius: number; // fração do raio total
  tilt: number; // inclinação (achatamento da elipse)
  speed: number; // rad/s
  width: number;
  color: string;
  alpha: number;
  phase: number;
  ribbon?: boolean; // fita larga e translúcida
}

const RINGS: Ring[] = [
  { radius: 0.92, tilt: 1.15, speed: 0.12, width: 1.2, color: '56,189,248', alpha: 0.55, phase: 0 },
  { radius: 0.86, tilt: 0.35, speed: -0.18, width: 1, color: '59,130,246', alpha: 0.5, phase: 1.2 },
  {
    radius: 0.78,
    tilt: 1.35,
    speed: 0.25,
    width: 9,
    color: '56,189,248',
    alpha: 0.07,
    phase: 2.1,
    ribbon: true,
  },
  { radius: 0.7, tilt: 0.8, speed: -0.3, width: 1.4, color: '165,243,252', alpha: 0.6, phase: 0.4 },
  {
    radius: 0.62,
    tilt: 1.5,
    speed: 0.4,
    width: 12,
    color: '59,130,246',
    alpha: 0.08,
    phase: 3.3,
    ribbon: true,
  },
  { radius: 0.55, tilt: 0.55, speed: -0.5, width: 1.2, color: '56,189,248', alpha: 0.7, phase: 4.4 },
  {
    radius: 0.45,
    tilt: 1.0,
    speed: 0.65,
    width: 6,
    color: '165,243,252',
    alpha: 0.1,
    phase: 5.1,
    ribbon: true,
  },
];

/**
 * Núcleo Polaris: orbe de energia em Canvas 2D.
 * Estados: ocioso, processando, ouvindo e falando (os dois últimos ficam prontos para a Fase 4).
 * `level` (0 a 1) é o volume do áudio, para reagir à voz no futuro.
 */
export function NucleoPolaris({
  state = 'ocioso',
  level = 0,
  className,
}: {
  state?: NucleusState;
  level?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  const levelRef = useRef(level);
  const glowSetting = useAppearanceStore((s) => s.glow);
  const glowRef = useRef(glowSetting);
  const reduced = useReducedMotion();

  useEffect(() => {
    stateRef.current = state;
    levelRef.current = level;
    glowRef.current = glowSetting;
  }, [state, level, glowSetting]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!container || !canvas || !ctx) return;

    let size = 0;
    let frame = 0;
    let lastTime = 0;
    let clock = 0; // tempo "virtual", acelera conforme o estado
    let speed = STATE_PARAMS[stateRef.current].speed;
    let glow = STATE_PARAMS[stateRef.current].glow;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = Math.min(container.clientWidth, container.clientHeight);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawStar = (cx: number, cy: number, outer: number, inner: number) => {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI / 4) * i - Math.PI / 2;
        const r = i % 2 === 0 ? outer : inner;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
    };

    const render = (t: number, realTime: number) => {
      const c = size / 2;
      const R = size * 0.46;
      const glowAmount = glow * glowRef.current;
      const audio = levelRef.current;
      const pulse = 1 + 0.035 * Math.sin(realTime * 1.6) * (speed > 2 ? 1.8 : 1) + audio * 0.12;

      ctx.clearRect(0, 0, size, size);
      ctx.globalCompositeOperation = 'lighter';

      // Halo
      const halo = ctx.createRadialGradient(c, c, 0, c, c, R);
      halo.addColorStop(0, `rgba(56,189,248,${0.32 * glowAmount})`);
      halo.addColorStop(0.45, `rgba(59,130,246,${0.12 * glowAmount})`);
      halo.addColorStop(1, 'rgba(3,8,20,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, size, size);

      // Anéis e fitas
      for (const ring of RINGS) {
        const angle = ring.phase + t * ring.speed;
        const squash = Math.abs(Math.cos(ring.tilt + Math.sin(t * 0.15 + ring.phase) * 0.25));
        const radius = R * ring.radius * pulse;
        ctx.beginPath();
        ctx.ellipse(c, c, radius, Math.max(radius * squash, 2), angle, 0, Math.PI * 2);
        ctx.lineWidth = ring.width;
        ctx.strokeStyle = `rgba(${ring.color},${Math.min(ring.alpha * glowAmount, 0.9)})`;
        ctx.shadowColor = `rgba(${ring.color},0.8)`;
        ctx.shadowBlur = ring.ribbon ? 0 : 6 * glowAmount;
        ctx.stroke();

        if (!ring.ribbon) {
          // Partícula brilhante percorrendo o anel
          const p = t * ring.speed * 3 + ring.phase;
          const px =
            c + Math.cos(p) * radius * Math.cos(angle) - Math.sin(p) * radius * squash * Math.sin(angle);
          const py =
            c + Math.cos(p) * radius * Math.sin(angle) + Math.sin(p) * radius * squash * Math.cos(angle);
          ctx.beginPath();
          ctx.fillStyle = 'rgba(230,240,255,0.9)';
          ctx.shadowBlur = 10 * glowAmount;
          ctx.arc(px, py, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;

      // Núcleo
      const coreR = R * 0.22 * pulse;
      const core = ctx.createRadialGradient(c, c, 0, c, c, coreR);
      core.addColorStop(0, `rgba(255,255,255,${0.95})`);
      core.addColorStop(0.35, `rgba(165,243,252,${0.6 * glowAmount})`);
      core.addColorStop(1, 'rgba(56,189,248,0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(c, c, coreR, 0, Math.PI * 2);
      ctx.fill();

      // Estrela de 4 pontas
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate(Math.sin(t * 0.2) * 0.08);
      ctx.translate(-c, -c);
      const starOuter = R * 0.3 * pulse;
      drawStar(c, c, starOuter, starOuter * 0.16);
      const starGradient = ctx.createRadialGradient(c, c, 0, c, c, starOuter);
      starGradient.addColorStop(0, 'rgba(255,255,255,1)');
      starGradient.addColorStop(0.5, 'rgba(165,243,252,0.85)');
      starGradient.addColorStop(1, 'rgba(56,189,248,0.1)');
      ctx.fillStyle = starGradient;
      ctx.shadowColor = 'rgba(165,243,252,1)';
      ctx.shadowBlur = 24 * glowAmount;
      ctx.fill();
      ctx.restore();

      ctx.globalCompositeOperation = 'source-over';
    };

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.1) : 0;
      lastTime = now;
      // Transição suave entre estados
      const target = STATE_PARAMS[stateRef.current];
      speed += (target.speed - speed) * Math.min(delta * 3, 1);
      glow += (target.glow - glow) * Math.min(delta * 3, 1);
      clock += delta * speed;
      render(clock, now / 1000);
    };

    const start = () => {
      cancelAnimationFrame(frame);
      lastTime = 0;
      if (reduced) render(0, 0);
      else frame = requestAnimationFrame(loop);
    };

    const onVisibility = () => (document.hidden ? cancelAnimationFrame(frame) : start());
    const observer = new ResizeObserver(() => {
      resize();
      if (reduced) render(0, 0);
    });

    resize();
    start();
    observer.observe(container);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reduced]);

  return (
    <div
      ref={containerRef}
      className={cn('relative flex aspect-square items-center justify-center', className)}
      role="img"
      aria-label={`Núcleo Polaris (${state})`}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
