import type { FinishSessionResult, WorkoutSession, WorkoutSet } from '@polaris/shared';
import { ArrowLeft, Check, Flag, Minus, Plus, Timer, Trash2, Trophy, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Select, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { cn } from '../../lib/cn';
import { formatDuration, formatLongDate, formatNumber, formatTimer } from '../../lib/format';
import { toast } from '../../stores/toastStore';
import { useDeleteSession, useExercises, useFinishSession, useSession, useSetMutations } from './api';
import { RecordList } from './ProgressTab';

/** Tela do treino: registra cada série, cronômetro de descanso e finalização. */
export function WorkoutSessionPage() {
  const { sessionId } = useParams();
  const query = useSession(sessionId);
  const session = query.data?.session;

  if (query.isPending) return <PolarisCard label="Treino · Sessão" state="loading" />;
  if (!session) {
    return (
      <EmptyState
        title="Treino não encontrado"
        action={
          <Link to="/academia" className="label-mono text-primary">
            Voltar para a Academia
          </Link>
        }
      />
    );
  }
  return session.finishedAt ? (
    <FinishedView session={session} records={query.data?.records ?? []} />
  ) : (
    <ActiveWorkout session={session} />
  );
}

/** Descanso que termina daqui a `seconds` segundos. */
const restFor = (seconds: number) => ({ endsAt: Date.now() + seconds * 1000, total: seconds });

/** Agrupa as séries por exercício, mantendo a ordem da ficha. */
function groupSets(sets: WorkoutSet[]) {
  const groups = new Map<string, WorkoutSet[]>();
  for (const set of sets) groups.set(set.exerciseId, [...(groups.get(set.exerciseId) ?? []), set]);
  return [...groups.values()];
}

function useElapsed(startedAt: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return Math.max(0, Math.round((now - new Date(startedAt).getTime()) / 1000));
}

function ActiveWorkout({ session }: { session: WorkoutSession }) {
  const navigate = useNavigate();
  const elapsed = useElapsed(session.startedAt);
  const { update, add, remove } = useSetMutations(session.id);
  const finish = useFinishSession();
  const discard = useDeleteSession();
  const exercises = useExercises();
  const [rest, setRest] = useState<{ endsAt: number; total: number } | null>(null);
  const [newExercise, setNewExercise] = useState('');
  const [finishing, setFinishing] = useState(false);
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<FinishSessionResult | null>(null);

  const groups = useMemo(() => groupSets(session.sets), [session.sets]);
  const done = session.sets.filter((s) => s.done);
  const volume = done.reduce((sum, s) => sum + s.weight * s.reps, 0);

  const toggleDone = (set: WorkoutSet) => {
    update.mutate({ id: set.id, done: !set.done });
    if (!set.done && set.restSeconds > 0) setRest(restFor(set.restSeconds));
  };

  const confirmFinish = async () => {
    const outcome = await finish.mutateAsync({ id: session.id, notes: notes || undefined });
    setFinishing(false);
    setResult(outcome);
  };

  return (
    <>
      <div className="mb-2">
        <Link
          to="/academia"
          className="label-mono inline-flex items-center gap-1 text-text-dim hover:text-star"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Academia
        </Link>
      </div>
      <PageHeader
        label="Treino · Em andamento"
        title={session.routineName ?? 'Treino'}
        actions={
          <>
            <Button
              variant="ghost"
              icon={X}
              onClick={() => {
                if (window.confirm('Descartar este treino? Nada dele será salvo.')) {
                  discard.mutate(session.id, { onSuccess: () => navigate('/academia') });
                }
              }}
            >
              Descartar
            </Button>
            <Button
              variant="primary"
              icon={Flag}
              onClick={() => setFinishing(true)}
              disabled={done.length === 0}
            >
              Finalizar treino
            </Button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label="Tempo" value={formatTimer(elapsed)} />
        <Stat label="Séries" value={`${done.length}/${session.sets.length}`} />
        <Stat label="Volume" value={`${formatNumber(volume)} kg`} />
      </div>

      <div className="space-y-4">
        {groups.map((sets, index) => (
          <PolarisCard
            key={sets[0]!.exerciseId}
            index={index}
            label={sets[0]!.muscleGroup}
            title={sets[0]!.exerciseName}
            badge={
              <Badge tone={sets.every((s) => s.done) ? 'success' : 'muted'}>
                {sets.filter((s) => s.done).length}/{sets.length}
              </Badge>
            }
          >
            <div className="label-mono mb-1 grid grid-cols-[2.5rem_1fr_1fr_3rem_2.5rem] gap-2 px-1 text-[10px] text-text-dim">
              <span>Série</span>
              <span>Carga (kg)</span>
              <span>Reps</span>
              <span className="text-center">Feita</span>
              <span />
            </div>
            <ul className="space-y-1.5">
              {sets.map((set) => (
                <SetRow
                  key={set.id}
                  set={set}
                  onChange={(patch) => update.mutate({ id: set.id, ...patch })}
                  onToggle={() => toggleDone(set)}
                  onRemove={() => remove.mutate(set.id)}
                />
              ))}
            </ul>
            <Button
              className="mt-3"
              size="sm"
              variant="ghost"
              icon={Plus}
              onClick={() => add.mutate(sets[0]!.exerciseId)}
            >
              Adicionar série
            </Button>
          </PolarisCard>
        ))}

        <div className="glass flex flex-wrap gap-2 p-4">
          <Select
            value={newExercise}
            onChange={(e) => setNewExercise(e.target.value)}
            aria-label="Adicionar exercício"
            className="min-w-60 flex-1"
          >
            <option value="">Adicionar outro exercício…</option>
            {exercises.data?.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} · {e.muscleGroup}
              </option>
            ))}
          </Select>
          <Button
            icon={Plus}
            disabled={!newExercise}
            onClick={() => {
              add.mutate(newExercise);
              setNewExercise('');
            }}
          >
            Adicionar
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {rest && <RestTimer key={rest.endsAt} rest={rest} onChange={setRest} />}
      </AnimatePresence>

      <Modal
        open={finishing}
        onClose={() => setFinishing(false)}
        title="Finalizar treino?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFinishing(false)}>
              Continuar treinando
            </Button>
            <Button
              variant="primary"
              icon={Flag}
              loading={finish.isPending}
              onClick={() => void confirmFinish()}
            >
              Finalizar
            </Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-text-dim">
          {done.length} séries feitas · {formatNumber(volume)} kg de volume · {formatDuration(elapsed)}
        </p>
        <Textarea
          rows={3}
          placeholder="Notas do treino (opcional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          aria-label="Notas"
        />
      </Modal>

      <Modal open={result !== null} onClose={() => navigate('/academia')} title="Treino concluído! 💪">
        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Duração" value={formatDuration(result.session.durationSeconds ?? 0)} />
              <Stat label="Volume total" value={`${formatNumber(result.session.totalVolume ?? 0)} kg`} />
            </div>
            {result.newRecords.length > 0 ? (
              <div>
                <p className="label-mono mb-2 flex items-center gap-2 text-star">
                  <Trophy className="h-4 w-4" /> Novos recordes pessoais
                </p>
                <RecordList records={result.newRecords} />
              </div>
            ) : (
              <p className="text-sm text-text-dim">
                Sem recordes desta vez, mas cada treino conta. A Polaris marcou o hábito "Treino" de hoje.
              </p>
            )}
            <Button variant="primary" className="w-full justify-center" onClick={() => navigate('/academia')}>
              Voltar para a Academia
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}

function SetRow({
  set,
  onChange,
  onToggle,
  onRemove,
}: {
  set: WorkoutSet;
  onChange: (patch: { weight?: number; reps?: number }) => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  // Rascunho local: só envia ao servidor quando o campo perde o foco.
  const [weight, setWeight] = useState(String(set.weight));
  const [reps, setReps] = useState(String(set.reps));

  const commit = () => {
    const patch: { weight?: number; reps?: number } = {};
    if (Number(weight) !== set.weight) patch.weight = Number(weight) || 0;
    if (Number(reps) !== set.reps) patch.reps = Math.round(Number(reps) || 0);
    if (Object.keys(patch).length) onChange(patch);
  };

  const inputClass =
    'h-10 w-full rounded-lg border border-border bg-bg-deep/60 px-2 text-center font-mono text-sm focus:border-primary focus:outline-none';

  return (
    <li
      className={cn(
        'grid grid-cols-[2.5rem_1fr_1fr_3rem_2.5rem] items-center gap-2 rounded-xl px-1 py-1 transition-colors',
        set.done && 'bg-success/10',
      )}
    >
      <span className="text-center font-mono text-sm text-primary">{set.setNumber}</span>
      <input
        aria-label={`Carga da série ${set.setNumber}`}
        className={inputClass}
        type="number"
        inputMode="decimal"
        step={0.5}
        min={0}
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        onBlur={commit}
      />
      <input
        aria-label={`Repetições da série ${set.setNumber}`}
        className={inputClass}
        type="number"
        inputMode="numeric"
        min={0}
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        onBlur={commit}
      />
      <button
        type="button"
        onClick={() => {
          commit();
          onToggle();
        }}
        aria-pressed={set.done}
        aria-label={set.done ? 'Desmarcar série' : 'Marcar série como feita'}
        className={cn(
          'mx-auto flex h-10 w-10 items-center justify-center rounded-lg border transition-all',
          set.done
            ? 'border-success bg-success/20 text-success shadow-[0_0_12px_rgba(52,211,153,0.4)]'
            : 'border-border text-text-dim hover:border-primary hover:text-star',
        )}
      >
        <Check className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remover série"
        className="mx-auto text-text-dim hover:text-danger"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

/** Toca um bipe curto (Web Audio, sem arquivos). */
function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch {
    // Sem áudio disponível: tudo bem, o aviso visual basta.
  }
}

/** Cronômetro de descanso flutuante. */
function RestTimer({
  rest,
  onChange,
}: {
  rest: { endsAt: number; total: number };
  onChange: (rest: { endsAt: number; total: number } | null) => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const remaining = Math.max(0, Math.ceil((rest.endsAt - now) / 1000));

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (remaining > 0) return;
    beep();
    navigator.vibrate?.(300);
    toast.info('Descanso finalizado', 'Hora da próxima série!');
    onChange(null);
  }, [remaining, onChange]);

  const adjust = (seconds: number) =>
    onChange({
      endsAt: Math.max(Date.now() + 1000, rest.endsAt + seconds * 1000),
      total: Math.max(rest.total + seconds, 1),
    });

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      className="glass fixed inset-x-4 bottom-24 z-40 mx-auto flex max-w-md items-center gap-3 bg-bg-base/95 p-3 md:bottom-6"
      role="timer"
      aria-live="polite"
    >
      <Timer className="h-5 w-5 shrink-0 text-primary" aria-hidden />
      <div className="flex-1">
        <p className="label-mono text-text-dim">Descanso</p>
        <p className="font-display text-2xl font-bold text-star glow-text tabular-nums">
          {formatTimer(remaining)}
        </p>
        <div className="mt-1 h-1 overflow-hidden rounded-full bg-primary/10">
          <div
            className="h-full bg-primary transition-[width] duration-300"
            style={{ width: `${(remaining / rest.total) * 100}%` }}
          />
        </div>
      </div>
      <Button
        size="icon"
        variant="ghost"
        icon={Minus}
        aria-label="Menos 15 segundos"
        onClick={() => adjust(-15)}
      />
      <Button
        size="icon"
        variant="ghost"
        icon={Plus}
        aria-label="Mais 15 segundos"
        onClick={() => adjust(15)}
      />
      <Button size="sm" onClick={() => onChange(null)}>
        Pular
      </Button>
    </motion.div>
  );
}

function FinishedView({
  session,
  records,
}: {
  session: WorkoutSession;
  records: FinishSessionResult['newRecords'];
}) {
  const groups = groupSets(session.sets.filter((s) => s.done));
  return (
    <>
      <div className="mb-2">
        <Link
          to="/academia?aba=historico"
          className="label-mono inline-flex items-center gap-1 text-text-dim hover:text-star"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Histórico
        </Link>
      </div>
      <PageHeader
        label={`Treino · ${formatLongDate(session.startedAt)}`}
        title={session.routineName ?? 'Treino'}
      />
      <div className="mb-5 grid grid-cols-3 gap-3">
        <Stat label="Duração" value={formatDuration(session.durationSeconds ?? 0)} />
        <Stat label="Séries" value={String(session.sets.filter((s) => s.done).length)} />
        <Stat label="Volume" value={`${formatNumber(session.totalVolume ?? 0)} kg`} />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {groups.map((sets, i) => (
            <PolarisCard
              key={sets[0]!.exerciseId}
              index={i}
              label={sets[0]!.muscleGroup}
              title={sets[0]!.exerciseName}
            >
              <ul className="flex flex-wrap gap-2">
                {sets.map((s) => (
                  <li key={s.id} className="rounded-lg border border-border px-3 py-1.5 font-mono text-sm">
                    {s.weight} kg × {s.reps}
                  </li>
                ))}
              </ul>
            </PolarisCard>
          ))}
          {session.notes && <p className="glass p-4 text-sm text-text-dim">{session.notes}</p>}
        </div>
        <PolarisCard icon={Trophy} label="Treino · Recordes" title="Recordes nesta sessão">
          <RecordList records={records} />
        </PolarisCard>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass px-4 py-3 text-center">
      <p className="label-mono text-text-dim">{label}</p>
      <p className="mt-1 font-mono text-lg text-star tabular-nums">{value}</p>
    </div>
  );
}
