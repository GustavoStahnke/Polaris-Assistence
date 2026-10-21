import { addDays, toDateKey } from '@polaris/shared';
import { cn } from '../../lib/cn';
import { formatShortDate } from '../../lib/format';

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
// Escala sequencial de um único tom (ciano), do mais apagado ao mais forte.
const LEVELS = ['bg-primary/8', 'bg-primary/30', 'bg-primary/50', 'bg-primary/75', 'bg-primary'];

/** Mapa de calor anual: cada quadrado é um dia; quanto mais forte, mais hábitos cumpridos. */
export function Heatmap({ year, days, max }: { year: number; days: Record<string, number>; max: number }) {
  const first = new Date(year, 0, 1);
  const start = addDays(first, -first.getDay());
  const weeks: Date[][] = [];
  for (let cursor = start; cursor.getFullYear() <= year && weeks.length < 54; cursor = addDays(cursor, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(cursor, i)));
  }
  const today = toDateKey();
  const level = (count: number) => (count <= 0 ? 0 : Math.min(4, Math.ceil((count / Math.max(max, 1)) * 4)));
  const columns = { gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` };

  return (
    <div className="overflow-x-auto pb-2">
      {/* Ocupa toda a largura do card; no celular, rola para o lado. */}
      <div className="min-w-[560px]">
        <div className="mb-1 grid gap-[3px]" style={columns}>
          {weeks.map((week, i) => {
            const monthStart = week.find((d) => d.getDate() === 1 && d.getFullYear() === year);
            return (
              <span
                key={i}
                className="label-mono overflow-visible text-[9px] whitespace-nowrap text-text-dim"
              >
                {monthStart ? MONTHS[monthStart.getMonth()] : ''}
              </span>
            );
          })}
        </div>
        <div className="grid grid-flow-col grid-rows-7 gap-[3px]" style={columns}>
          {weeks.flatMap((week) =>
            week.map((day) => {
              const key = toDateKey(day);
              const count = days[key] ?? 0;
              const outside = day.getFullYear() !== year;
              return (
                <span
                  key={key}
                  title={outside ? undefined : `${formatShortDate(day)}: ${count} hábito(s)`}
                  className={cn(
                    'aspect-square w-full rounded-[3px]',
                    outside ? 'bg-transparent' : LEVELS[level(count)],
                    key === today && 'ring-1 ring-star',
                  )}
                />
              );
            }),
          )}
        </div>
        <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-text-dim">
          Menos
          {LEVELS.map((l) => (
            <span key={l} className={cn('h-[11px] w-[11px] rounded-[3px]', l)} />
          ))}
          Mais
        </div>
      </div>
    </div>
  );
}
