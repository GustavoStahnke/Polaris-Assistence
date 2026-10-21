import { cn } from '../../lib/cn';

type Tone = 'success' | 'warning' | 'danger' | 'muted' | 'primary';

const tones: Record<Tone, string> = {
  success: 'bg-success text-success',
  warning: 'bg-warning text-warning',
  danger: 'bg-danger text-danger',
  muted: 'bg-text-faint text-text-faint',
  primary: 'bg-primary text-primary',
};

/** Ponto de status que pulsa (ex.: SISTEMA ONLINE). */
export function StatusDot({
  tone = 'success',
  pulse = true,
  className,
}: {
  tone?: Tone;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block h-2 w-2 shrink-0 rounded-full',
        tones[tone],
        pulse && 'animate-pulse-dot',
        className,
      )}
      style={{ boxShadow: '0 0 8px currentColor' }}
    />
  );
}
