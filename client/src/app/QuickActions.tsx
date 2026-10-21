import { TASK_PRIORITIES, TASK_PRIORITY_LABELS, type TaskPriority } from '@polaris/shared';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Button } from '../components/ui/Button';
import { Field, Input, Select } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useCurrentReading } from '../modules/biblioteca/api';
import { LogReadingModal } from '../modules/biblioteca/LogReadingModal';
import { NoteForm } from '../modules/notas/NoteForm';
import { useTaskMutations } from '../modules/tarefas/api';
import { toast } from '../stores/toastStore';
import { useUiStore } from '../stores/uiStore';

/** Janelas das ações rápidas (nova nota, nova tarefa, registrar leitura) e o botão "+". */
export function QuickActions() {
  const { quickAction, setQuickAction } = useUiStore();
  const location = useLocation();
  const navigate = useNavigate();
  const current = useCurrentReading();
  const close = () => setQuickAction(null);
  const readingBook = quickAction === 'reading' ? (current.data?.[0] ?? null) : null;

  // "Registrar leitura" sem nenhum livro em andamento: leva para a estante.
  const noBook = quickAction === 'reading' && current.isSuccess && !readingBook;
  useEffect(() => {
    if (!noBook) return;
    toast.info('Nenhum livro em leitura', 'Marque um livro como “Lendo” na Biblioteca.');
    setQuickAction(null);
    navigate('/biblioteca');
  }, [noBook, setQuickAction, navigate]);

  const hideFab = location.pathname.startsWith('/academia/treino');

  return (
    <>
      {!hideFab && (
        <button
          type="button"
          onClick={() => setQuickAction('note')}
          aria-label="Nova nota rápida"
          title="Nova nota rápida"
          className="fixed right-4 bottom-24 z-30 flex h-14 w-14 items-center justify-center rounded-full border border-primary/70 bg-bg-base/90 text-star shadow-[0_0_calc(24px*var(--glow-strength))_rgba(56,189,248,calc(0.45*var(--glow-strength)))] backdrop-blur transition-transform hover:scale-105 md:right-6 md:bottom-6"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      <Modal open={quickAction === 'note'} onClose={close} title="Nota rápida" className="max-w-2xl">
        <NoteForm autoFocus onDone={close} />
      </Modal>

      <Modal open={quickAction === 'task'} onClose={close} title="Nova tarefa">
        <QuickTaskForm onDone={close} />
      </Modal>

      <LogReadingModal book={readingBook} onClose={close} />
    </>
  );
}

function QuickTaskForm({ onDone }: { onDone: () => void }) {
  const { create } = useTaskMutations();
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('media');
  const [dueDate, setDueDate] = useState('');
  const submit = async () => {
    await create.mutateAsync({ title: title.trim(), priority, dueDate: dueDate || null });
    onDone();
  };
  return (
    <div className="space-y-4">
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && title.trim() && void submit()}
        placeholder="O que precisa ser feito?"
        aria-label="Título da tarefa"
      />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prioridade">
          {(id) => (
            <Select id={id} value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {TASK_PRIORITY_LABELS[p]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Prazo">
          {(id) => <Input id={id} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />}
        </Field>
      </div>
      <Button
        variant="primary"
        icon={Plus}
        loading={create.isPending}
        disabled={!title.trim()}
        onClick={() => void submit()}
      >
        Criar tarefa
      </Button>
    </div>
  );
}
