import { getModality, toDateKey } from '@polaris/shared';
import { CalendarDays, History, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { MonthCalendar } from '../../components/ui/MonthCalendar';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { formatLongDate, formatTime } from '../../lib/format';
import { useEnabledModalities, useSessions } from './api';
import { modalityIcon, sessionHighlights } from './modality';
import { ModalityChips, type ModalityFilter } from './ModalityChips';

export function HistoryTab() {
  const sessions = useSessions();
  const modalities = useEnabledModalities();
  const [filter, setFilter] = useState<ModalityFilter>('todas');
  const [day, setDay] = useState<string | null>(null);
  const list = useMemo(
    () => (sessions.data ?? []).filter((s) => filter === 'todas' || s.modality === filter),
    [sessions.data, filter],
  );

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
    <>
      {modalities.length > 1 && (
        <ModalityChips modalities={modalities} value={filter} onChange={setFilter} withAll className="mb-4" />
      )}
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
          label="Histórico · Treinos"
          title={day ? formatLongDate(`${day}T12:00:00`) : 'Todos os treinos'}
          state={sessions.isPending ? 'loading' : 'ready'}
        >
          {visible.length === 0 ? (
            <EmptyState
              compact
              title="Nenhum treino aqui"
              message="Os treinos finalizados e registrados aparecem nesta lista."
            />
          ) : (
            <ul className="divide-y divide-border/40">
              {visible.map((s) => {
                const Icon = modalityIcon(s.modality);
                const modality = getModality(s.modality);
                return (
                  <li key={s.id}>
                    <Link
                      to={`/academia/treino/${s.id}`}
                      className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg px-2 py-3 transition-colors hover:bg-primary/5"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/5 text-primary">
                        <Icon className="h-4 w-4" aria-label={modality.name} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{s.routineName ?? modality.name}</p>
                        <p className="text-xs text-text-dim">
                          {modality.name} · {formatLongDate(s.startedAt)} · {formatTime(s.startedAt)}
                        </p>
                      </div>
                      {sessionHighlights(s).map((item) => (
                        <span key={item} className="font-mono text-sm text-text-dim">
                          {item}
                        </span>
                      ))}
                      {s.records > 0 && (
                        <Badge tone="star">
                          <Trophy className="h-3 w-3" /> {s.records} PR
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </PolarisCard>
      </div>
    </>
  );
}
