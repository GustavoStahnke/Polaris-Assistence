import { toDateKey } from '@polaris/shared';
import { CalendarDays, History, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { MonthCalendar } from '../../components/ui/MonthCalendar';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { formatDuration, formatLongDate, formatNumber, formatTime } from '../../lib/format';
import { useSessions } from './api';

export function HistoryTab() {
  const sessions = useSessions();
  const [day, setDay] = useState<string | null>(null);
  const list = useMemo(() => sessions.data ?? [], [sessions.data]);

  const marked = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of list) {
      const key = toDateKey(new Date(s.startedAt));
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  }, [list]);

  const visible = day ? list.filter((s) => toDateKey(new Date(s.startedAt)) === day) : list;

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <PolarisCard
        icon={CalendarDays}
        label="Histórico · Calendário"
        title={`${list.length} treinos registrados`}
      >
        <MonthCalendar
          markedDays={marked}
          selectedDay={day}
          onSelectDay={(d) => setDay(day === d ? null : d)}
        />
        {day && (
          <button
            type="button"
            onClick={() => setDay(null)}
            className="label-mono mt-3 text-primary hover:text-star"
          >
            Mostrar todos
          </button>
        )}
      </PolarisCard>

      <PolarisCard
        icon={History}
        label="Histórico · Sessões"
        title={day ? formatLongDate(`${day}T12:00:00`) : 'Todos os treinos'}
        state={sessions.isPending ? 'loading' : 'ready'}
      >
        {visible.length === 0 ? (
          <EmptyState
            compact
            title="Nenhum treino aqui"
            message="Os treinos finalizados aparecem nesta lista."
          />
        ) : (
          <ul className="divide-y divide-border/40">
            {visible.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/academia/treino/${s.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg px-2 py-3 transition-colors hover:bg-primary/5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{s.routineName ?? 'Treino'}</p>
                    <p className="text-xs text-text-dim">
                      {formatLongDate(s.startedAt)} · {formatTime(s.startedAt)}
                    </p>
                  </div>
                  <span className="font-mono text-sm text-text-dim">
                    {formatDuration(s.durationSeconds ?? 0)}
                  </span>
                  <span className="font-mono text-sm text-text-dim">
                    {formatNumber(s.totalVolume ?? 0)} kg
                  </span>
                  <span className="font-mono text-sm text-text-dim">{s.sets} séries</span>
                  {s.records > 0 && (
                    <Badge tone="star">
                      <Trophy className="h-3 w-3" /> {s.records} PR
                    </Badge>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PolarisCard>
    </div>
  );
}
