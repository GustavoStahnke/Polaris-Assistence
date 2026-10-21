import { Check, Flame, Target } from 'lucide-react';
import { DynamicIcon } from '../../components/ui/DynamicIcon';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { cn } from '../../lib/cn';
import { useHabitMutations, useHabits } from './api';

/** Card "Hábitos de hoje" do Painel: checklist rápido. */
export function HabitsTodayCard({ index, className }: { index?: number; className?: string }) {
  const habits = useHabits();
  const { toggle } = useHabitMutations();
  const list = habits.data ?? [];
  const done = list.filter((h) => h.doneToday).length;

  return (
    <PolarisCard
      index={index}
      className={className}
      icon={Target}
      label="Rotina · Hábitos"
      title={list.length ? `${done} de ${list.length} hoje` : 'Hábitos de hoje'}
      state={habits.isPending ? 'loading' : habits.isError ? 'error' : list.length ? 'ready' : 'empty'}
      emptyTitle="Nenhum hábito ainda"
      emptyMessage="Crie seus hábitos e marque aqui todo dia."
      to="/habitos"
    >
      <ul className="grid grid-cols-1 gap-1.5">
        {list.map((habit) => (
          <li key={habit.id}>
            <button
              type="button"
              onClick={() => toggle.mutate({ id: habit.id })}
              aria-pressed={habit.doneToday}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm transition-colors',
                habit.doneToday ? 'text-text-dim' : 'hover:bg-primary/5',
              )}
            >
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border',
                  habit.doneToday
                    ? 'border-success bg-success/20 text-success'
                    : 'border-border text-primary',
                )}
              >
                {habit.doneToday ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <DynamicIcon name={habit.icon} className="h-3.5 w-3.5" />
                )}
              </span>
              <span className={cn('flex-1 truncate', habit.doneToday && 'line-through')}>{habit.name}</span>
              {habit.streak > 0 && (
                <span className="flex items-center gap-0.5 font-mono text-xs text-warning">
                  <Flame className="h-3 w-3" aria-hidden /> {habit.streak}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </PolarisCard>
  );
}
