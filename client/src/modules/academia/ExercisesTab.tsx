import {
  EQUIPMENT,
  EXERCISE_MEASURE_LABELS,
  EXERCISE_MEASURES,
  MODALITY_LIST,
  MUSCLE_GROUPS,
  type Exercise,
  type ExerciseInput,
  type ExerciseMeasure,
  type Modality,
  type ModalityId,
} from '@polaris/shared';
import { Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { normalizeText } from '../../lib/text';
import { useCreateExercise, useDeleteExercise, useEnabledModalities, useExercises } from './api';
import { modalityIcon } from './modality';
import { ModalityChips } from './ModalityChips';

/** Modalidades de força que o usuário pratica (se nenhuma estiver ativa, mostra todas). */
function useStrengthModalities(): Modality[] {
  const enabled = useEnabledModalities().filter((m) => m.kind === 'forca');
  return enabled.length ? enabled : MODALITY_LIST.filter((m) => m.kind === 'forca');
}

export function ExercisesTab() {
  const exercises = useExercises();
  const remove = useDeleteExercise();
  const modalities = useStrengthModalities();
  const [chosen, setChosen] = useState<ModalityId | null>(null);
  const modality = modalities.find((m) => m.id === chosen) ?? modalities[0]!;
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);

  const catalog = exercises.data;
  const groups = useMemo(() => {
    const q = normalizeText(query.trim());
    const map = new Map<string, Exercise[]>();
    for (const e of catalog ?? []) {
      if (e.modality !== modality.id) continue;
      if (q && !normalizeText(`${e.name} ${e.muscleGroup} ${e.equipment}`).includes(q)) continue;
      map.set(e.muscleGroup, [...(map.get(e.muscleGroup) ?? []), e]);
    }
    return [...map.entries()];
  }, [catalog, query, modality.id]);

  return (
    <>
      {modalities.length > 1 && (
        <ModalityChips modalities={modalities} value={modality.id} onChange={setChosen} className="mb-3" />
      )}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-60 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-dim"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Buscar exercício de ${modality.name.toLowerCase()}…`}
            className="pl-9"
            aria-label="Buscar exercício"
          />
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setAdding(true)}>
          Novo exercício
        </Button>
      </div>
      {catalog && groups.length === 0 && (
        <p className="glass p-4 text-sm text-text-dim">
          Nenhum exercício encontrado. Crie um em “Novo exercício”.
        </p>
      )}
      <div className="gap-5 md:columns-2 xl:columns-3">
        {groups.map(([group, items], index) => (
          <div key={group} className="mb-5 break-inside-avoid">
            <PolarisCard
              index={index}
              icon={modalityIcon(modality.id)}
              label={`${modality.name} · Grupo`}
              title={group}
            >
              <ul className="divide-y divide-border/40">
                {items.map((e) => (
                  <li key={e.id} className="flex items-center gap-2 py-2 text-sm">
                    <span className="flex-1">{e.name}</span>
                    {e.measure === 'tempo' && <Badge tone="star">Segundos</Badge>}
                    <Badge tone="muted">{e.equipment}</Badge>
                    {e.isCustom && (
                      <Button
                        size="icon"
                        variant="ghost"
                        icon={Trash2}
                        aria-label={`Apagar ${e.name}`}
                        onClick={() => window.confirm(`Apagar "${e.name}"?`) && remove.mutate(e.id)}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </PolarisCard>
          </div>
        ))}
      </div>
      <NewExerciseModal
        key={modality.id}
        open={adding}
        onClose={() => setAdding(false)}
        modalities={modalities}
        initialModality={modality.id}
      />
    </>
  );
}

function NewExerciseModal({
  open,
  onClose,
  modalities,
  initialModality,
}: {
  open: boolean;
  onClose: () => void;
  modalities: Modality[];
  initialModality: ModalityId;
}) {
  const create = useCreateExercise();
  const blank = (base: Partial<ExerciseInput> = {}): ExerciseInput => ({
    name: '',
    modality: base.modality ?? initialModality,
    muscleGroup: base.muscleGroup ?? 'Peito',
    equipment: base.equipment ?? (initialModality === 'calistenia' ? 'Peso corporal' : 'Halteres'),
    measure: 'reps',
  });
  const [form, setForm] = useState<ExerciseInput>(() => blank());
  const submit = async () => {
    await create.mutateAsync(form);
    setForm(blank(form));
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Novo exercício"
      footer={
        <Button
          variant="primary"
          icon={Plus}
          loading={create.isPending}
          disabled={form.name.trim().length < 2}
          onClick={() => void submit()}
        >
          Criar
        </Button>
      }
    >
      <div className="space-y-4">
        <Field label="Nome">
          {(id) => (
            <Input id={id} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          )}
        </Field>
        {modalities.length > 1 && (
          <div>
            <p className="label-mono mb-2 text-text-dim">Modalidade</p>
            <ModalityChips
              modalities={modalities}
              value={form.modality}
              onChange={(modality) => setForm({ ...form, modality })}
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Grupo muscular">
            {(id) => (
              <Select
                id={id}
                value={form.muscleGroup}
                onChange={(e) => setForm({ ...form, muscleGroup: e.target.value })}
              >
                {MUSCLE_GROUPS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Equipamento">
            {(id) => (
              <Select
                id={id}
                value={form.equipment}
                onChange={(e) => setForm({ ...form, equipment: e.target.value })}
              >
                {EQUIPMENT.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field
            label="Medida da série"
            hint="Use segundos para isometrias, como prancha e L-sit."
            className="col-span-2"
          >
            {(id) => (
              <Select
                id={id}
                value={form.measure}
                onChange={(e) => setForm({ ...form, measure: e.target.value as ExerciseMeasure })}
              >
                {EXERCISE_MEASURES.map((m) => (
                  <option key={m} value={m}>
                    {EXERCISE_MEASURE_LABELS[m]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
      </div>
    </Modal>
  );
}
