import type { LucideIcon } from 'lucide-react';
import { Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

/** Estado vazio com mensagem com personalidade. */
export function EmptyState({
  icon: Icon = Sparkles,
  title,
  message,
  action,
  compact,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  message?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-1.5 py-4' : 'gap-3 py-10',
        className,
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-primary/5 text-primary">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <p className="font-semibold text-text">{title}</p>
      {message && <p className="max-w-sm text-sm text-text-dim">{message}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
