import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type BadgeTone = 'primary' | 'success' | 'warning' | 'danger' | 'muted' | 'star';

const tones: Record<BadgeTone, string> = {
  primary: 'text-primary border-primary/50 bg-primary/10',
  success: 'text-success border-success/50 bg-success/10',
  warning: 'text-warning border-warning/50 bg-warning/10',
  danger: 'text-danger border-danger/50 bg-danger/10',
  muted: 'text-text-dim border-border bg-white/5',
  star: 'text-star border-star/50 bg-star/10',
};

/** Selo em pílula com texto mono maiúsculo. */
export function Badge({
  tone = 'primary',
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[10px] tracking-[0.16em] uppercase',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
