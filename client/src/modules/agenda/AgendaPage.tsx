import { fromDateKey, type AgendaItem } from '@polaris/shared';
import { Bell, CalendarDays, Clock, ExternalLink, MapPin, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { Tabs } from '../../components/ui/Tabs';
import { capitalize, formatLongDate, formatRelative } from '../../lib/format';
import { useAgenda, useRefreshAgenda } from './api';
import { countdown, itemDay, timeRange } from './time';
import { integrationsPath } from '../../lib/paths';

/** Re-renderiza a cada 30 segundos (para a contagem regressiva). */
function useNow(interval = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
}

export function AgendaPage() {
  const [range, setRange] = useState<'hoje' | 'semana'>('hoje');
  const agenda = useAgenda(range);
  const refresh = useRefreshAgenda(range);
  const now = useNow();
  const data = agenda.data;

  const days = useMemo(() => {
    const groups = new Map<string, AgendaItem[]>();
    for (const item of data?.items ?? [])
      groups.set(itemDay(item), [...(groups.get(itemDay(item)) ?? []), item]);
    return [...groups.entries()];
  }, [data?.items]);

  return (
    <>
      <PageHeader
        label="Agenda · Compromissos"
        title="Agenda"
        actions={
          <Button icon={RefreshCw} loading={refresh.isPending} onClick={() => refresh.mutate()}>
            Atualizar
          </Button>
        }
      />
      <Tabs
        className="mb-5 w-fit"
        value={range}
        onChange={setRange}
        tabs={[
          { id: 'hoje', label: 'Hoje' },
          { id: 'semana', label: 'Próximos 7 dias' },
        ]}
      />

      {data && (data.state === 'not_configured' || data.state === 'disabled') && (
        <div className="glass mb-5 flex flex-wrap items-center gap-3 p-4 text-sm">
          <CalendarDays className="h-5 w-5 text-primary" aria-hidden />
          <span className="flex-1 text-text-dim">
            Conecte sua Conta Google para ver os eventos do Google Agenda. Os lembretes do Polaris já aparecem
            aqui.
          </span>
          <Link to={integrationsPath('google-account')} className="label-mono text-primary hover:text-star">
            Conectar →
          </Link>
        </div>
      )}
      {data && (data.state === 'error' || data.state === 'stale') && data.error && (
        <p className="mb-5 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
          {data.state === 'stale' ? 'Mostrando a última agenda salva. ' : ''}
          {data.error}{' '}
          <Link to={integrationsPath('google-calendar')} className="underline">
            Ver integração
          </Link>
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <PolarisCard
          icon={Clock}
          label="Agenda · Próximo"
          title={data?.next?.title ?? 'Nada pela frente'}
          state={agenda.isPending ? 'loading' : 'ready'}
          className="self-start"
        >
          {data?.next ? (
            <div>
              <p className="font-display text-3xl font-bold text-star glow-text">
                {countdown(data.next.start, now)}
              </p>
              <p className="mt-1 text-sm text-text-dim">
                {capitalize(formatLongDate(data.next.start))} · {timeRange(data.next)}
              </p>
              {data.next.location && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-text-dim">
                  <MapPin className="h-3.5 w-3.5" aria-hidden /> {data.next.location}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-dim">
              Agenda livre {range === 'hoje' ? 'pelo resto do dia' : 'nos próximos dias'}. 🌌
            </p>
          )}
          {data?.fetchedAt && (
            <p className="label-mono mt-4 text-[10px] text-text-dim">
              Google Agenda · {formatRelative(data.fetchedAt)}
            </p>
          )}
        </PolarisCard>

        <div className="space-y-5">
          {!agenda.isPending && days.length === 0 && (
            <div className="glass">
              <EmptyState
                icon={CalendarDays}
                title="Agenda livre"
                message="Nenhum compromisso neste período. Aproveite!"
              />
            </div>
          )}
          {days.map(([day, items], index) => (
            <PolarisCard
              key={day}
              index={index}
              icon={CalendarDays}
              label="Agenda · Dia"
              title={capitalize(formatLongDate(fromDateKey(day)))}
            >
              <ul className="divide-y divide-border/40">
                {items.map((item) => {
                  const past = !item.allDay && new Date(item.end ?? item.start).getTime() < now;
                  return (
                    <li key={item.id} className={`flex items-start gap-3 py-3 ${past ? 'opacity-50' : ''}`}>
                      <span
                        className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: item.color ?? '#38BDF8' }}
                        aria-hidden
                      />
                      <div className="w-28 shrink-0 font-mono text-sm text-primary">{timeRange(item)}</div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-text-dim">
                          {[item.calendarName, item.location].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      {item.source === 'lembrete' ? (
                        <Badge tone="star">
                          <Bell className="h-3 w-3" /> Lembrete
                        </Badge>
                      ) : (
                        item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Abrir no Google Agenda"
                            className="text-text-dim hover:text-star"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )
                      )}
                    </li>
                  );
                })}
              </ul>
            </PolarisCard>
          ))}
        </div>
      </div>
    </>
  );
}
