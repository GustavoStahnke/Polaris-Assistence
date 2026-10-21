import { useId } from 'react';
import { cn } from '../../lib/cn';

/** Estrela-guia de 4 pontas com brilho. */
export function StarIcon({ className }: { className?: string }) {
  // id único por instância: dois SVGs com o mesmo id de gradiente quebram quando um está oculto.
  const gradientId = useId();
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn('drop-shadow-[0_0_8px_rgba(165,243,252,0.8)]', className)}
      aria-hidden
    >
      <defs>
        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="45%" stopColor="#A5F3FC" />
          <stop offset="100%" stopColor="#38BDF8" />
        </radialGradient>
      </defs>
      <path d="M32 2 L37 27 L62 32 L37 37 L32 62 L27 37 L2 32 L27 27 Z" fill={`url(#${gradientId})`} />
    </svg>
  );
}

/** Logo: estrela + "POLARIS" em Orbitron. */
export function Logo({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <StarIcon className="h-7 w-7" />
      {!compact && (
        <span className="glow-text font-display text-lg font-bold tracking-[0.28em] text-star">POLARIS</span>
      )}
    </div>
  );
}
