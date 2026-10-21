import { HABIT_ICON_OPTIONS, WEEKDAY_LABELS, fromDateKey, type Habit } from '@polaris/shared';
import { Archive, Check, Flame, Pencil, Plus, Save, Sparkles, Target } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DynamicIcon } from '../../components/ui/DynamicIcon';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field, Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { cn } from '../../lib/cn';
import { useHabitMutations, useHabits, useHeatmap } from './api';
import { Heatmap } from './Heatmap';

export function HabitosPage() {
  const habits = useHabits();
  const { toggle, archive } = useHabitMutations();
  const [editing, setEditing] = useState<Habit | 'new' | null>(null);
  const [heatmapHabit, setHeatmapHabit] = useState<string>('');
  const year = new Date().getFullYear();
  const heatmap = useHeatmap(year, heatmapHabit || null);
  const list = habits.data ?? [];
  const doneCount = list.filter((h) => h.doneToday).length;

  return (
    <>
      <PageHeader
        label="Rotina · Hábitos"
        title="Hábitos"
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setEditing('new')}>
            Novo hábito
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <PolarisCard
          icon={Target}
          label="Hábitos · Hoje"
          title={list.length ? `${doneCount} de ${list.length} feitos hoje` : 'Hábitos de hoje'}
          state={habits.isPending ? 'loading' : 'ready'}
        >
          {list.length === 0 ? (
            <EmptyState
              compact
              title="Nenhum hábito ainda"
              message="Crie um hábito para começar uma sequência."
            />
          ) : (
            <ul className="space-y-2">
              {list.map((habit, i) => (
                <motion.li
                  key={habit.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-3 transition-colors',
                    habit.doneToday ? 'border-success/50 bg-success/10' : 'border-border/60',
                  )}
                >
                  <button
                    type="button"
                    aria-pressed={habit.doneToday}
                    aria-label={habit.doneToday ? `Desmarcar ${habit.name}` : `Marcar ${habit.name}`}
                    onClick={() => toggle.mutate({ id: habit.id })}
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all',
                      habit.doneToday
                        ? 'border-success bg-success/20 text-success shadow-[0_0_14px_rgba(52,211,153,0.4)]'
                        : 'border-border text-primary hover:border-primary',
                    )}
                  >
                    {habit.doneToday ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <DynamicIcon name={habit.icon} className="h-5 w-5" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{habit.name}</p>
                    <div className="mt-1 flex items-center gap-1" aria-label="Últimos 7 dias">
                      {habit.last7.map((d) => (
                        <span
                          key={d.date}
                          title={WEEKDAY_LABELS[fromDateKey(d.date).getDay()]}
                          className={cn(
                            'h-2 w-4 rounded-full',
                            d.done ? 'bg-primary shadow-[0_0_6px_rgba(56,189,248,0.7)]' : 'bg-primary/10',
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  {habit.autoKey && (
                    <Badge tone="star" className="hidden sm:inline-flex">
                      <Sparkles className="h-3 w-3" /> Automático
                    </Badge>
                  )}
                  <span
                    className="flex items-center gap-1 font-mono text-sm text-warning"
                    title="Sequência de dias"
                  >
                    <Flame className="h-4 w-4" aria-hidden /> {habit.streak}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    icon={Pencil}
                    aria-label={`Editar ${habit.name}`}
                    onClick={() => setEditing(habit)}
                  />
                </motion.li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-text-dim">
            Os hábitos com selo “Automático” são marcados sozinhos: registrar um treino marca Treino e
            registrar páginas lidas marca Leitura.
          </p>
        </PolarisCard>

        <PolarisCard icon={Flame} label={`Hábitos · ${year}`} title="Mapa de calor do ano">
          <Select
            value={heatmapHabit}
            onChange={(e) => setHeatmapHabit(e.target.value)}
            className="mb-4 w-auto"
            aria-label="Hábito do mapa"
          >
            <option value="">Todos os hábitos</option>
            {list.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </Select>
          {heatmap.data && <Heatmap year={year} days={heatmap.data.days} max={heatmap.data.habits} />}
        </PolarisCard>
      </div>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Novo hábito' : 'Editar hábito'}
      >
        {editing !== null && (
          <HabitForm
            key={editing === 'new' ? 'new' : editing.id}
            habit={editing === 'new' ? undefined : editing}
            onDone={() => setEditing(null)}
            onArchive={(id) => archive.mutate(id, { onSuccess: () => setEditing(null) })}
          />
        )}
      </Modal>
    </>
  );
}

function HabitForm({
  habit,
  onDone,
  onArchive,
}: {
  habit?: Habit;
  onDone: () => void;
  onArchive: (id: string) => void;
}) {
  const { create, update } = useHabitMutations();
  const [name, setName] = useState(habit?.name ?? '');
  const [icon, setIcon] = useState(habit?.icon ?? 'Target');
  const save = async () => {
    if (habit) await update.mutateAsync({ id: habit.id, name, icon });
    else await create.mutateAsync({ name, icon });
    onDone();
  };
  return (
    <div className="space-y-4">
      <Field label="Nome">
        {(id) => (
          <Input
            id={id}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Alongar 10 minutos"
          />
        )}
      </Field>
      <div>
        <p className="label-mono mb-2 text-text-dim">Ícone</p>
        <div className="flex flex-wrap gap-2">
          {HABIT_ICON_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              aria-label={option}
              aria-pressed={icon === option}
              onClick={() => setIcon(option)}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-xl border transition-colors',
                icon === option
                  ? 'border-primary bg-primary/20 text-star'
                  : 'border-border text-text-dim hover:text-star',
              )}
            >
              <DynamicIcon name={option} className="h-5 w-5" />
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="primary"
          icon={Save}
          loading={create.isPending || update.isPending}
          disabled={!name.trim()}
          onClick={() => void save()}
        >
          Salvar
        </Button>
        {habit && (
          <Button variant="ghost" icon={Archive} className="ml-auto" onClick={() => onArchive(habit.id)}>
            Arquivar
          </Button>
        )}
      </div>
    </div>
  );
}
