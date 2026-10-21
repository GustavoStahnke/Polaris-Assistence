import {
  REMINDER_RECURRENCE_LABELS,
  REMINDER_RECURRENCES,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUSES,
  toDateKey,
  type ReminderRecurrence,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '@polaris/shared';
import {
  Bell,
  BellRing,
  Check,
  CheckCircle2,
  ListTodo,
  Pencil,
  Plus,
  Repeat,
  Save,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field, Input, Select, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { Tabs } from '../../components/ui/Tabs';
import { cn } from '../../lib/cn';
import { formatDateTime, formatRelative } from '../../lib/format';
import { toast } from '../../stores/toastStore';
import { useReminderMutations, useReminders, useTaskMutations, useTasks } from './api';
import { PRIORITY_TONES, dueLabel } from './taskLabels';

export function TarefasPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('aba') === 'lembretes' ? 'lembretes' : 'tarefas';
  return (
    <>
      <PageHeader label="Foco · Tarefas" title="Tarefas" />
      <Tabs
        className="mb-5 w-fit"
        value={tab}
        onChange={(id) => setParams({ aba: id })}
        tabs={[
          { id: 'tarefas', label: 'Tarefas' },
          { id: 'lembretes', label: 'Lembretes' },
        ]}
      />
      {tab === 'tarefas' ? <TasksTab /> : <RemindersTab />}
    </>
  );
}

type TaskFilter = 'abertas' | 'hoje' | 'atrasadas' | 'concluidas';

function TasksTab() {
  const tasks = useTasks();
  const { create, update, remove } = useTaskMutations();
  const [filter, setFilter] = useState<TaskFilter>('abertas');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('media');
  const [dueDate, setDueDate] = useState('');
  const [editing, setEditing] = useState<Task | null>(null);
  const today = toDateKey();
  const list = tasks.data ?? [];

  const filters: Record<TaskFilter, (t: Task) => boolean> = {
    abertas: (t) => t.status !== 'concluida',
    hoje: (t) => t.status !== 'concluida' && t.dueDate === today,
    atrasadas: (t) => t.status !== 'concluida' && Boolean(t.dueDate && t.dueDate < today),
    concluidas: (t) => t.status === 'concluida',
  };
  const priorityOrder = { alta: 0, media: 1, baixa: 2 };
  const visible = list
    .filter(filters[filter])
    .sort(
      (a, b) =>
        (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999') ||
        priorityOrder[a.priority] - priorityOrder[b.priority],
    );

  const add = async () => {
    if (!title.trim()) return;
    await create.mutateAsync({ title: title.trim(), priority, dueDate: dueDate || null });
    setTitle('');
    setDueDate('');
  };

  return (
    <div className="space-y-5">
      <div className="glass flex flex-wrap gap-2 p-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void add()}
          placeholder="O que precisa ser feito?"
          className="min-w-60 flex-1"
          aria-label="Nova tarefa"
        />
        <Select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority)}
          className="w-auto"
          aria-label="Prioridade"
        >
          {TASK_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              Prioridade {TASK_PRIORITY_LABELS[p].toLowerCase()}
            </option>
          ))}
        </Select>
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-auto"
          aria-label="Prazo"
        />
        <Button
          variant="primary"
          icon={Plus}
          loading={create.isPending}
          disabled={!title.trim()}
          onClick={() => void add()}
        >
          Adicionar
        </Button>
      </div>

      <Tabs
        value={filter}
        onChange={setFilter}
        tabs={[
          { id: 'abertas', label: 'Abertas', count: list.filter(filters.abertas).length },
          { id: 'hoje', label: 'Hoje', count: list.filter(filters.hoje).length },
          { id: 'atrasadas', label: 'Atrasadas', count: list.filter(filters.atrasadas).length },
          { id: 'concluidas', label: 'Concluídas', count: list.filter(filters.concluidas).length },
        ]}
      />

      {visible.length === 0 ? (
        <div className="glass">
          <EmptyState
            icon={CheckCircle2}
            title={filter === 'concluidas' ? 'Nada concluído ainda' : 'Nada pendente aqui'}
            message={
              filter === 'abertas' ? 'Mente livre. Adicione uma tarefa quando surgir algo.' : undefined
            }
          />
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map((task) => {
            const due = task.dueDate ? dueLabel(task.dueDate, today) : null;
            const done = task.status === 'concluida';
            return (
              <li key={task.id} className={cn('glass flex items-start gap-3 p-3.5', done && 'opacity-60')}>
                <button
                  type="button"
                  aria-label={done ? 'Reabrir tarefa' : 'Concluir tarefa'}
                  onClick={() => update.mutate({ id: task.id, status: done ? 'pendente' : 'concluida' })}
                  className={cn(
                    'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-colors',
                    done ? 'border-success bg-success/20 text-success' : 'border-border hover:border-primary',
                  )}
                >
                  {done && <Check className="h-4 w-4" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={cn('font-medium', done && 'line-through')}>{task.title}</p>
                  {task.description && (
                    <p className="line-clamp-2 text-sm text-text-dim">{task.description}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Badge tone={PRIORITY_TONES[task.priority]}>{TASK_PRIORITY_LABELS[task.priority]}</Badge>
                    {due && !done && <Badge tone={due.tone}>{due.text}</Badge>}
                    {task.status === 'em_andamento' && <Badge tone="primary">Em andamento</Badge>}
                    {done && task.completedAt && (
                      <Badge tone="success">Concluída {formatRelative(task.completedAt)}</Badge>
                    )}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  icon={Pencil}
                  aria-label="Editar tarefa"
                  onClick={() => setEditing(task)}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  icon={Trash2}
                  aria-label="Apagar tarefa"
                  onClick={() => remove.mutate(task.id)}
                />
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Editar tarefa">
        {editing && <TaskEditor key={editing.id} task={editing} onDone={() => setEditing(null)} />}
      </Modal>
    </div>
  );
}

function TaskEditor({ task, onDone }: { task: Task; onDone: () => void }) {
  const { update } = useTaskMutations();
  const [form, setForm] = useState({
    title: task.title,
    description: task.description ?? '',
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate ?? '',
  });
  const save = async () => {
    await update.mutateAsync({
      id: task.id,
      ...form,
      description: form.description || null,
      dueDate: form.dueDate || null,
    });
    onDone();
  };
  return (
    <div className="space-y-4">
      <Field label="Título">
        {(id) => (
          <Input id={id} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        )}
      </Field>
      <Field label="Descrição">
        {(id) => (
          <Textarea
            id={id}
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        )}
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Prioridade">
          {(id) => (
            <Select
              id={id}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {TASK_PRIORITY_LABELS[p]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Status">
          {(id) => (
            <Select
              id={id}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
            >
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {TASK_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Prazo">
          {(id) => (
            <Input
              id={id}
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          )}
        </Field>
      </div>
      <Button
        variant="primary"
        icon={Save}
        loading={update.isPending}
        disabled={!form.title.trim()}
        onClick={() => void save()}
      >
        Salvar
      </Button>
    </div>
  );
}

function RemindersTab() {
  const reminders = useReminders();
  const { create, update, remove } = useReminderMutations();
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 3600_000);
  const [form, setForm] = useState({
    title: '',
    date: toDateKey(inOneHour),
    time: `${String(inOneHour.getHours()).padStart(2, '0')}:00`,
    recurrence: 'nenhuma' as ReminderRecurrence,
    notes: '',
  });
  const [permission, setPermission] = useState(() =>
    typeof Notification === 'undefined' ? 'denied' : Notification.permission,
  );
  const pending = (reminders.data ?? []).filter((r) => !r.done);
  const done = (reminders.data ?? []).filter((r) => r.done);

  const submit = async () => {
    const remindAt = new Date(`${form.date}T${form.time}:00`);
    if (Number.isNaN(remindAt.getTime())) return toast.error('Data ou hora inválida');
    await create.mutateAsync({
      title: form.title,
      remindAt: remindAt.toISOString(),
      recurrence: form.recurrence,
      notes: form.notes || null,
    });
    setForm({ ...form, title: '', notes: '' });
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <div className="space-y-5">
        {permission !== 'granted' && typeof Notification !== 'undefined' && (
          <div className="glass flex items-start gap-3 border-warning/40 p-4">
            <BellRing className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
            <div className="flex-1">
              <p className="text-sm">
                Ative as notificações para receber os lembretes mesmo com o Polaris em outra aba.
              </p>
              <Button
                size="sm"
                className="mt-2"
                onClick={() => void Notification.requestPermission().then((p) => setPermission(p))}
                disabled={permission === 'denied'}
              >
                {permission === 'denied' ? 'Bloqueado no navegador' : 'Ativar notificações'}
              </Button>
            </div>
          </div>
        )}
        <PolarisCard icon={Bell} label="Lembretes · Novo" title="Me lembre de…">
          <div className="space-y-3">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex.: Tomar remédio"
              aria-label="Título do lembrete"
            />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Dia">
                {(id) => (
                  <Input
                    id={id}
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Hora">
                {(id) => (
                  <Input
                    id={id}
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                  />
                )}
              </Field>
            </div>
            <Field label="Repetir">
              {(id) => (
                <Select
                  id={id}
                  value={form.recurrence}
                  onChange={(e) => setForm({ ...form, recurrence: e.target.value as ReminderRecurrence })}
                >
                  {REMINDER_RECURRENCES.map((r) => (
                    <option key={r} value={r}>
                      {REMINDER_RECURRENCE_LABELS[r]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Detalhes (opcional)"
              aria-label="Detalhes"
            />
            <Button
              variant="primary"
              icon={Plus}
              loading={create.isPending}
              disabled={!form.title.trim()}
              onClick={() => void submit()}
            >
              Criar lembrete
            </Button>
          </div>
        </PolarisCard>
      </div>

      <div className="space-y-5">
        <PolarisCard icon={ListTodo} label="Lembretes · Próximos" title={`${pending.length} ativo(s)`}>
          {pending.length === 0 ? (
            <p className="text-sm text-text-dim">Nenhum lembrete ativo.</p>
          ) : (
            <ul className="divide-y divide-border/40">
              {pending.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-3">
                  <Bell
                    className={cn(
                      'h-4 w-4 shrink-0',
                      new Date(r.remindAt) < now ? 'text-warning' : 'text-primary',
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-text-dim">
                      {formatDateTime(r.remindAt)} · {formatRelative(r.remindAt)}
                      {r.notes && ` · ${r.notes}`}
                    </p>
                  </div>
                  {r.recurrence !== 'nenhuma' && (
                    <Badge tone="primary">
                      <Repeat className="h-3 w-3" /> {REMINDER_RECURRENCE_LABELS[r.recurrence]}
                    </Badge>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    icon={Check}
                    aria-label="Concluir lembrete"
                    onClick={() => update.mutate({ id: r.id, done: true })}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    icon={Trash2}
                    aria-label="Apagar lembrete"
                    onClick={() => remove.mutate(r.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </PolarisCard>
        {done.length > 0 && (
          <PolarisCard
            icon={CheckCircle2}
            label="Lembretes · Concluídos"
            title={`${done.length} concluído(s)`}
          >
            <ul className="divide-y divide-border/40">
              {done.slice(0, 20).map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-2 text-sm text-text-dim">
                  <span className="flex-1 line-through">{r.title}</span>
                  <span className="text-xs">{formatDateTime(r.remindAt)}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    icon={Trash2}
                    aria-label="Apagar lembrete"
                    onClick={() => remove.mutate(r.id)}
                  />
                </li>
              ))}
            </ul>
          </PolarisCard>
        )}
      </div>
    </div>
  );
}
