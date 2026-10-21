import type { ReactNode } from 'react';

/** Cabeçalho das páginas: rótulo mono + título em Orbitron ("PAINEL"). */
export function PageHeader({ label, title, actions }: { label: string; title: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="label-mono text-primary">{label}</p>
        <h1 className="glow-text mt-1 font-display text-2xl font-bold tracking-[0.12em] uppercase md:text-3xl">
          {title}
        </h1>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
