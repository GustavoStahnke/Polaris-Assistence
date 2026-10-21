import { EQUIPMENT, MUSCLE_GROUPS, type Exercise, type ExerciseInput } from '@polaris/shared';
import { Dumbbell, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { normalizeText } from '../../lib/text';
import { useCreateExercise, useDeleteExercise, useExercises } from './api';

export function ExercisesTab() {
  const exercises = useExercises();
  const remove = useDeleteExercise();
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);

  const catalog = exercises.data;
  const groups = useMemo(() => {
    const q = normalizeText(query.trim());
    const map = new Map<string, Exercise[]>();
    for (const e of catalog ?? []) {
      if (q && !normalizeText(`${e.name} ${e.muscleGroup} ${e.equipment}`).includes(q)) continue;
      map.set(e.muscleGroup, [...(map.get(e.muscleGroup) ?? []), e]);
    }
    return [...map.entries()];
  }, [catalog, query]);

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-60 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-dim"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar exercício…"
            className="pl-9"
            aria-label="Buscar exercício"
          />
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setAdding(true)}>
          Novo exercício
        </Button>
      </div>
      <div className="gap-5 md:columns-2 xl:columns-3">
        {groups.map(([group, items], index) => (
          <div key={group} className="mb-5 break-inside-avoid">
            <PolarisCard index={index} icon={Dumbbell} label="Catálogo · Grupo" title={group}>
              <ul className="divide-y divide-border/40">
                {items.map((e) => (
                  <li key={e.id} className="flex items-center gap-2 py-2 text-sm">
                    <span className="flex-1">{e.name}</span>
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
      <NewExerciseModal open={adding} onClose={() => setAdding(false)} />
    </>
  );
}

function NewExerciseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateExercise();
  const [form, setForm] = useState<ExerciseInput>({ name: '', muscleGroup: 'Peito', equipment: 'Halteres' });
  const submit = async () => {
    await create.mutateAsync(form);
    setForm({ name: '', muscleGroup: form.muscleGroup, equipment: form.equipment });
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
        </div>
      </div>
    </Modal>
  );
}
