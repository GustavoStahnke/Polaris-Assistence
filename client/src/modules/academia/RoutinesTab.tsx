import { WEEKDAY_LABELS, type Exercise, type Routine, type RoutineInput } from '@polaris/shared';
import { ArrowDown, ArrowUp, ClipboardList, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { EmptyState } from '../../components/ui/EmptyState';
import { Field, Input, Select, Textarea } from '../../components/ui/Input';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { cn } from '../../lib/cn';
import { useDeleteRoutine, useExercises, useRoutines, useSaveRoutine } from './api';

type EditorState = (RoutineInput & { id?: string }) | null;

const emptyRoutine = (): RoutineInput => ({ name: '', description: '', weekdays: [], exercises: [] });

export function RoutinesTab() {
  const routines = useRoutines();
  const remove = useDeleteRoutine();
  const [editing, setEditing] = useState<EditorState>(null);

  const edit = (routine: Routine) =>
    setEditing({
      id: routine.id,
      name: routine.name,
      description: routine.description ?? '',
      weekdays: routine.weekdays,
      exercises: routine.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        targetSets: e.targetSets,
        targetReps: e.targetReps,
        targetWeight: e.targetWeight,
        restSeconds: e.restSeconds,
        notes: e.notes,
      })),
    });

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" icon={Plus} onClick={() => setEditing(emptyRoutine())}>
          Nova ficha
        </Button>
      </div>
      {routines.data?.length === 0 && (
        <div className="glass">
          <EmptyState
            icon={ClipboardList}
            title="Nenhuma ficha ainda"
            message="Monte sua Ficha A, B, C… com os exercícios, séries e dias da semana."
          />
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {routines.data?.map((routine, index) => (
          <PolarisCard
            key={routine.id}
            index={index}
            icon={ClipboardList}
            label="Academia · Ficha"
            title={routine.name}
            badge={
              <span className="flex flex-wrap gap-1">
                {routine.weekdays.map((d) => (
                  <Badge key={d}>{WEEKDAY_LABELS[d]}</Badge>
                ))}
              </span>
            }
          >
            {routine.description && <p className="mb-3 text-sm text-text-dim">{routine.description}</p>}
            <ol className="space-y-1.5 text-sm">
              {routine.exercises.map((e, i) => (
                <li key={e.id} className="flex justify-between gap-2">
                  <span>
                    <span className="mr-2 font-mono text-text-dim">{i + 1}.</span>
                    {e.exerciseName}
                  </span>
                  <span className="shrink-0 font-mono text-text-dim">
                    {e.targetSets}×{e.targetReps}
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-4 flex gap-2">
              <Button size="sm" icon={Pencil} onClick={() => edit(routine)}>
                Editar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                icon={Trash2}
                onClick={() => {
                  if (
                    window.confirm(
                      `Apagar a ficha "${routine.name}"? Os treinos já feitos continuam no histórico.`,
                    )
                  ) {
                    remove.mutate(routine.id);
                  }
                }}
              >
                Apagar
              </Button>
            </div>
          </PolarisCard>
        ))}
      </div>
      <RoutineEditor value={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function RoutineEditor({ value, onClose }: { value: EditorState; onClose: () => void }) {
  return (
    <Drawer
      open={value !== null}
      onClose={onClose}
      label="Academia · Ficha"
      title={value?.id ? 'Editar ficha' : 'Nova ficha'}
      width="max-w-2xl"
    >
      {value && <RoutineForm key={value.id ?? 'new'} initial={value} onDone={onClose} />}
    </Drawer>
  );
}

function RoutineForm({ initial, onDone }: { initial: RoutineInput & { id?: string }; onDone: () => void }) {
  const [form, setForm] = useState(initial);
  const [pick, setPick] = useState('');
  const exercises = useExercises();
  const save = useSaveRoutine();

  const byId = useMemo(() => new Map((exercises.data ?? []).map((e) => [e.id, e])), [exercises.data]);
  const groups = useMemo(() => {
    const map = new Map<string, Exercise[]>();
    for (const e of exercises.data ?? []) map.set(e.muscleGroup, [...(map.get(e.muscleGroup) ?? []), e]);
    return [...map.entries()];
  }, [exercises.data]);

  type Item = RoutineInput['exercises'][number];
  const setItem = (index: number, patch: Partial<Item>) =>
    setForm((f) => ({ ...f, exercises: f.exercises.map((e, i) => (i === index ? { ...e, ...patch } : e)) }));
  const move = (index: number, delta: number) =>
    setForm((f) => {
      const list = [...f.exercises];
      const [item] = list.splice(index, 1);
      list.splice(index + delta, 0, item!);
      return { ...f, exercises: list };
    });

  const submit = async () => {
    await save.mutateAsync({ ...form, description: form.description || null });
    onDone();
  };

  return (
    <div className="space-y-5">
      <Field label="Nome da ficha">
        {(id) => (
          <Input
            id={id}
            value={form.name}
            placeholder="Ex.: Ficha A — Peito e tríceps"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        )}
      </Field>
      <Field label="Descrição (opcional)">
        {(id) => (
          <Textarea
            id={id}
            rows={2}
            value={form.description ?? ''}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        )}
      </Field>

      <div>
        <p className="label-mono mb-2 text-text-dim">Dias da semana</p>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAY_LABELS.map((label, day) => {
            const active = form.weekdays.includes(day);
            return (
              <Button
                key={label}
                variant="pill"
                active={active}
                aria-pressed={active}
                onClick={() =>
                  setForm({
                    ...form,
                    weekdays: active
                      ? form.weekdays.filter((d) => d !== day)
                      : [...form.weekdays, day].sort(),
                  })
                }
              >
                {label}
              </Button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="label-mono mb-2 text-text-dim">Exercícios ({form.exercises.length})</p>
        <ol className="space-y-2">
          {form.exercises.map((item, index) => (
            <li key={`${item.exerciseId}-${index}`} className="rounded-xl border border-border/60 p-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-primary">{index + 1}</span>
                <span className="flex-1 truncate font-medium">
                  {byId.get(item.exerciseId)?.name ?? 'Exercício'}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  icon={ArrowUp}
                  aria-label="Subir"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  icon={ArrowDown}
                  aria-label="Descer"
                  disabled={index === form.exercises.length - 1}
                  onClick={() => move(index, 1)}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  icon={Trash2}
                  aria-label="Remover exercício"
                  onClick={() =>
                    setForm({ ...form, exercises: form.exercises.filter((_, i) => i !== index) })
                  }
                />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <NumberField
                  label="Séries"
                  value={item.targetSets}
                  onChange={(v) => setItem(index, { targetSets: v ?? 1 })}
                />
                <Field label="Repetições">
                  {(id) => (
                    <Input
                      id={id}
                      value={item.targetReps}
                      onChange={(e) => setItem(index, { targetReps: e.target.value })}
                    />
                  )}
                </Field>
                <NumberField
                  label="Carga (kg)"
                  step={0.5}
                  value={item.targetWeight ?? null}
                  onChange={(v) => setItem(index, { targetWeight: v })}
                />
                <NumberField
                  label="Descanso (s)"
                  step={15}
                  value={item.restSeconds}
                  onChange={(v) => setItem(index, { restSeconds: v ?? 60 })}
                />
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-3 flex gap-2">
          <Select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Escolher exercício">
            <option value="">Escolha um exercício…</option>
            {groups.map(([group, items]) => (
              <optgroup key={group} label={group}>
                {items.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.equipment})
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
          <Button
            icon={Plus}
            disabled={!pick}
            onClick={() => {
              setForm({
                ...form,
                exercises: [
                  ...form.exercises,
                  { exerciseId: pick, targetSets: 3, targetReps: '10', targetWeight: null, restSeconds: 90 },
                ],
              });
              setPick('');
            }}
          >
            Adicionar
          </Button>
        </div>
      </div>

      <Button
        variant="primary"
        icon={Save}
        loading={save.isPending}
        disabled={!form.name.trim()}
        onClick={() => void submit()}
      >
        Salvar ficha
      </Button>
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  step = 1,
  className,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  step?: number;
  className?: string;
}) {
  return (
    <Field label={label} className={cn(className)}>
      {(id) => (
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step={step}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        />
      )}
    </Field>
  );
}
