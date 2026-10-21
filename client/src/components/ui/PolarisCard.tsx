import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, ArrowUpRight, Inbox } from 'lucide-react';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '../../lib/cn';
import { EmptyState } from './EmptyState';
import { SkeletonLines } from './Skeleton';
import { integrationsPath } from '../../lib/paths';

export type CardState = 'ready' | 'loading' | 'empty' | 'error';

export interface PolarisCardProps {
  icon?: LucideIcon;
  /** Rótulo no padrão "CATEGORIA · ASSUNTO" */
  label: string;
  title?: ReactNode;
  badge?: ReactNode;
  /** Texto do rodapé, ex.: "OPEN-METEO · ATUALIZADO HÁ 4 MIN" */
  footer?: ReactNode;
  /** Link do botão "ABRIR ↗" */
  to?: string;
  actionLabel?: string;
  state?: CardState;
  emptyTitle?: string;
  emptyMessage?: ReactNode;
  emptyAction?: ReactNode;
  errorMessage?: ReactNode;
  /** Posição na grade: usada para a entrada em sequência (40ms entre cada). */
  index?: number;
  className?: string;
  contentClassName?: string;
  children?: ReactNode;
}

/** Card de vidro do Polaris, com os estados carregando, vazio e erro. */
export function PolarisCard({
  icon: Icon,
  label,
  title,
  badge,
  footer,
  to,
  actionLabel = 'Abrir',
  state = 'ready',
  emptyTitle = 'Nada por aqui ainda',
  emptyMessage,
  emptyAction,
  errorMessage,
  index = 0,
  className,
  contentClassName,
  children,
}: PolarisCardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: 'easeOut' }}
      className={cn(
        'glass group relative flex flex-col overflow-hidden p-5 transition-[transform,box-shadow,border-color] duration-300',
        'hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_0_calc(32px*var(--glow-strength))_rgba(56,189,248,calc(0.18*var(--glow-strength)))]',
        className,
      )}
    >
      {/* Linha luminosa no topo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/80 to-transparent opacity-70 transition-opacity group-hover:opacity-100"
      />

      <header className="flex items-start gap-3">
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary glow-box">
            <Icon className="h-[18px] w-[18px]" aria-hidden />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="label-mono truncate text-text-dim">{label}</p>
            {badge}
          </div>
          {title && <h2 className="mt-0.5 truncate text-[17px] font-semibold text-text">{title}</h2>}
        </div>
      </header>

      <div className={cn('mt-4 flex-1', contentClassName)}>
        {state === 'loading' && <SkeletonLines lines={3} />}
        {state === 'empty' && (
          <EmptyState compact icon={Inbox} title={emptyTitle} message={emptyMessage} action={emptyAction} />
        )}
        {state === 'error' && (
          <div className="flex flex-col items-center gap-2 py-3 text-center">
            <AlertTriangle className="h-5 w-5 text-danger" aria-hidden />
            <p className="text-sm text-text-dim">{errorMessage ?? 'Não foi possível carregar.'}</p>
            <Link to={integrationsPath()} className="label-mono text-primary hover:text-star">
              Ver integrações →
            </Link>
          </div>
        )}
        {state === 'ready' && children}
      </div>

      {(footer || to) && (
        <footer className="mt-4 flex items-center justify-between gap-2 border-t border-border/50 pt-3">
          <p className="label-mono truncate text-[10px] text-text-dim/90">{footer}</p>
          {to && (
            <Link
              to={to}
              className="label-mono inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] text-text-dim transition-colors hover:border-primary hover:text-star"
            >
              {actionLabel} <ArrowUpRight className="h-3 w-3" aria-hidden />
            </Link>
          )}
        </footer>
      )}
    </motion.section>
  );
}
