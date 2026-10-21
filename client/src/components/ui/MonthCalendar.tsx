import { addDays, toDateKey } from '@polaris/shared';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/cn';
import { capitalize } from '../../lib/format';
import { Button } from './Button';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });

/** Calendário do mês com dias marcados (ex.: dias com treino). */
export function MonthCalendar({
  markedDays,
  onSelectDay,
  selectedDay,
}: {
  /** Dias marcados (YYYY-MM-DD) → quantidade (mostrada como intensidade). */
  markedDays: Map<string, number>;
  onSelectDay?: (day: string) => void;
  selectedDay?: string | null;
}) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = addDays(first, -first.getDay());
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const today = toDateKey();

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          icon={ChevronLeft}
          aria-label="Mês anterior"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        />
        <p className="font-semibold">{capitalize(monthFormatter.format(month))}</p>
        <Button
          variant="ghost"
          size="icon"
          icon={ChevronRight}
          aria-label="Próximo mês"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        />
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="label-mono py-1 text-[10px] text-text-dim">
            {d}
          </span>
        ))}
        {days.map((day) => {
          const key = toDateKey(day);
          const count = markedDays.get(key) ?? 0;
          const inMonth = day.getMonth() === month.getMonth();
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay?.(key)}
              aria-label={`${day.getDate()}${count ? `, ${count} registro(s)` : ''}`}
              className={cn(
                'relative flex aspect-square items-center justify-center rounded-lg text-sm transition-colors',
                inMonth ? 'text-text' : 'text-text-faint',
                count > 0 &&
                  'border border-primary/60 bg-primary/20 font-semibold text-star shadow-[0_0_12px_rgba(56,189,248,0.35)]',
                key === today && 'ring-1 ring-star',
                selectedDay === key && 'bg-primary/40',
                onSelectDay && 'hover:bg-primary/10',
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
