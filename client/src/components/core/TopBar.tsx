import { useQuery } from '@tanstack/react-query';
import { RefreshCw, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { fetchHealth } from '../../lib/api';
import { cn } from '../../lib/cn';
import { capitalize, formatClock, formatLongDate } from '../../lib/format';
import { useUiStore } from '../../stores/uiStore';
import { StatusDot } from '../ui/StatusDot';
import { Logo } from './Logo';

/** Relógio ao vivo, isolado para só ele renderizar a cada segundo. */
function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-col items-center leading-tight">
      <span className="glow-text font-mono text-lg font-medium tracking-[0.12em] text-star tabular-nums md:text-xl">
        {formatClock(now)}
      </span>
      <span className="hidden text-xs text-text-dim sm:block">{capitalize(formatLongDate(now))}</span>
    </div>
  );
}

export interface IntegrationsSummary {
  connected: number;
  available: number;
  syncing: boolean;
}

/** Barra superior: logo, relógio e status do sistema. */
export function TopBar({ integrations }: { integrations?: IntegrationsSummary }) {
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const health = useQuery({ queryKey: ['health'], queryFn: fetchHealth, refetchInterval: 30_000, retry: 0 });
  const online = health.isSuccess;

  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-bg-deep/70 backdrop-blur-md">
      <div className="mx-auto grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 md:px-6">
        <Link to="/" aria-label="Ir para o Painel" className="justify-self-start">
          <span className="hidden sm:block">
            <Logo />
          </span>
          <span className="sm:hidden">
            <Logo compact />
          </span>
        </Link>

        <Clock />

        <div className="flex items-center justify-end gap-3 md:gap-5">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="label-mono hidden items-center gap-2 rounded-full border border-border px-3 py-1.5 text-text-dim transition-colors hover:border-primary hover:text-star lg:flex"
          >
            <Search className="h-3.5 w-3.5" aria-hidden /> Buscar{' '}
            <kbd className="text-text-faint">Ctrl K</kbd>
          </button>
          <div className="label-mono flex items-center gap-2 text-text-dim">
            <StatusDot tone={health.isPending ? 'warning' : online ? 'success' : 'danger'} />
            <span className="hidden md:inline">
              {online ? 'Sistema online' : health.isPending ? 'Conectando' : 'Offline'}
            </span>
          </div>
          {integrations && (
            <Link
              to="/integracoes"
              className="label-mono hidden items-center gap-2 text-text-dim transition-colors hover:text-star md:flex"
              title="Integrações conectadas"
            >
              <span>
                Integrações{' '}
                <span className="text-primary">
                  {integrations.connected}/{integrations.available}
                </span>
              </span>
              <RefreshCw
                className={cn(
                  'h-3.5 w-3.5',
                  integrations.syncing ? 'animate-spin text-primary' : 'text-text-faint',
                )}
                aria-label={integrations.syncing ? 'Sincronizando' : 'Sincronizado'}
              />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
