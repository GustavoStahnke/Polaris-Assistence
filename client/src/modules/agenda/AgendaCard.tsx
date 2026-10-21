import { CalendarDays } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Badge } from '../../components/ui/Badge';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { useAgenda } from './api';
import { countdown, timeRange } from './time';

/** Card "Agenda · Hoje" do Painel: próximo compromisso com contagem regressiva e a lista do dia. */
export function AgendaCard({ index, className }: { index?: number; className?: string }) {
  const agenda = useAgenda('hoje');
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const data = agenda.data;
  const items = data?.items ?? [];
  const notConnected = data?.state === 'not_configured' || data?.state === 'disabled';

  return (
    <PolarisCard
      index={index}
      className={className}
      icon={CalendarDays}
      label="Agenda · Hoje"
      title={data?.next?.title ?? (items.length ? `${items.length} compromisso(s)` : 'Agenda livre')}
      badge={data?.next ? <Badge tone="warning">{countdown(data.next.start, now)}</Badge> : undefined}
      state={
        agenda.isPending
          ? 'loading'
          : data?.state === 'error' && !items.length
            ? 'error'
            : items.length
              ? 'ready'
              : 'empty'
      }
      emptyTitle={notConnected ? 'Conecte o Google Agenda' : 'Agenda livre'}
      emptyMessage={
        notConnected
          ? 'Veja seus compromissos do dia aqui.'
          : 'Nenhum compromisso hoje. Que tal adiantar algo importante?'
      }
      emptyAction={
        notConnected && (
          <Link to="/integracoes?config=google-account" className="label-mono text-primary hover:text-star">
            Conectar →
          </Link>
        )
      }
      errorMessage={data?.error ?? 'Não foi possível carregar a agenda.'}
      footer={notConnected ? 'Lembretes do Polaris' : 'Google Agenda'}
      to="/agenda"
    >
      <ul className="space-y-2">
        {items.slice(0, 5).map((item) => {
          const past = !item.allDay && new Date(item.end ?? item.start).getTime() < now;
          return (
            <li key={item.id} className={`flex gap-3 text-sm ${past ? 'opacity-50' : ''}`}>
              <span className="w-24 shrink-0 font-mono text-primary">
                {item.allDay ? 'Dia inteiro' : timeRange(item).split(' –')[0]}
              </span>
              <span className="truncate">{item.title}</span>
            </li>
          );
        })}
      </ul>
    </PolarisCard>
  );
}
