import { cn } from '../../lib/cn';

/** Bloco de carregamento com um brilho passando. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-primary/8', className)} aria-hidden>
      <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-primary/15 to-transparent" />
    </div>
  );
}

/** Conjunto de linhas de carregamento para dentro de um card. */
export function SkeletonLines({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2.5" role="status" aria-label="Carregando">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}
