import { TASK_PRIORITY_LABELS } from '@polaris/shared';
import { Bell, Check, CheckSquare } from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { formatTime } from '../../lib/format';
import { useTaskMutations, useTodayAgenda } from './api';
import { PRIORITY_TONES, dueLabel } from './taskLabels';

/** Card "Tarefas e lembretes do dia" do Painel. */
export function TasksTodayCard({ index, className }: { index?: number; className?: string }) {
  const today = useTodayAgenda();
  const { update } = useTaskMutations();
  const data = today.data;
  const count = (data?.tasks.length ?? 0) + (data?.reminders.length ?? 0);

  return (
    <PolarisCard
      index={index}
      className={className}
      icon={CheckSquare}
      label="Foco · Tarefas"
      title={count ? `${count} para hoje` : 'Dia tranquilo'}
      badge={data?.overdue ? <Badge tone="danger">{data.overdue} atrasada(s)</Badge> : undefined}
      state={today.isPending ? 'loading' : today.isError ? 'error' : count ? 'ready' : 'empty'}
      emptyTitle="Nada pendente para hoje"
      emptyMessage="Aproveite o foco ou adicione uma tarefa com Ctrl+K."
      to="/tarefas"
    >
      <ul className="space-y-2">
        {data?.tasks.slice(0, 5).map((task) => {
          const due = task.dueDate ? dueLabel(task.dueDate) : null;
          return (
            <li key={task.id} className="flex items-center gap-2.5 text-sm">
              <button
                type="button"
                aria-label={`Concluir ${task.title}`}
                onClick={() => update.mutate({ id: task.id, status: 'concluida' })}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-border text-transparent hover:border-success hover:text-success"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-0 flex-1 truncate">{task.title}</span>
              {due?.tone === 'danger' ? (
                <Badge tone="danger">Atrasada</Badge>
              ) : (
                <Badge tone={PRIORITY_TONES[task.priority]}>{TASK_PRIORITY_LABELS[task.priority]}</Badge>
              )}
            </li>
          );
        })}
        {data?.reminders.map((r) => (
          <li key={r.id} className="flex items-center gap-2.5 text-sm">
            <Bell className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{r.title}</span>
            <span className="font-mono text-xs text-text-dim">{formatTime(r.remindAt)}</span>
          </li>
        ))}
      </ul>
    </PolarisCard>
  );
}
