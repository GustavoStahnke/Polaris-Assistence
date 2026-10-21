import {
  getModality,
  toDateKey,
  type ActivityLogResult,
  type ModalityId,
  type ModalityKind,
  type Routine,
  type WorkoutSession,
} from '@polaris/shared';
import { Save } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Field, Input, Select, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { cn } from '../../lib/cn';
import { formatDuration, formatNumber, formatTime } from '../../lib/format';
import { toast } from '../../stores/toastStore';
import { useSaveActivity } from './api';
import { describeActivityRecords, formatPacePerKm } from './modality';
import { NumberField } from './RoutinesTab';

/** O que registrar: uma modalidade, opcionalmente a partir de um plano, ou a correção de um treino. */
export interface ActivityTarget {
  modality: ModalityId;
  plan?: Routine;
  session?: WorkoutSession;
}

/** Janela "Registrar treino" de corrida, caminhada e lutas. */
export function ActivityLogModal({
  target,
  onClose,
  onSaved,
}: {
  target: ActivityTarget | null;
  onClose: () => void;
  onSaved?: (result: ActivityLogResult) => void;
}) {
  const modality = getModality(target?.modality);
  return (
    <Modal
      open={target !== null}
      onClose={onClose}
      title={target?.session ? `Editar treino · ${modality.name}` : `Registrar ${modality.name}`}
    >
      {target && (
        <ActivityForm
          key={target.session?.id ?? target.plan?.id ?? target.modality}
          target={target}
          onDone={(result) => {
            onSaved?.(result);
            onClose();
          }}
        />
      )}
    </Modal>
  );
}

const INTENSITY_LABELS = [
  '',
  'Leve',
  'Leve',
  'Leve',
  'Moderado',
  'Moderado',
  'Moderado',
  'Forte',
  'Forte',
  'Máximo',
  'Máximo',
];

/**
 * Lê a duração digitada. Um número sozinho é em minutos ("45").
 * Na corrida, "45:30" é min:seg; nas lutas, "1:30" é h:min. "1:05:00" é sempre h:min:seg.
 */
function parseDuration(text: string, kind: ModalityKind): number | null {
  const parts = text.trim().replace(',', '.').split(':');
  if (parts.some((p) => p === '' || Number.isNaN(Number(p)))) return null;
  const n = parts.map(Number);
  let seconds: number;
  if (n.length === 1) seconds = n[0]! * 60;
  else if (n.length === 2) seconds = kind === 'distancia' ? n[0]! * 60 + n[1]! : n[0]! * 3600 + n[1]! * 60;
  else if (n.length === 3) seconds = n[0]! * 3600 + n[1]! * 60 + n[2]!;
  else return null;
  return seconds > 0 ? Math.round(seconds) : null;
}

/** Duração em segundos → texto do campo (o contrário de parseDuration). */
function durationText(seconds: number, kind: ModalityKind): string {
  if (kind !== 'distancia') return String(Math.round(seconds / 60));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
}

const numberOrNull = (text: string) => (text.trim() === '' ? null : Number(text.replace(',', '.')));

function initialForm({ modality, plan, session }: ActivityTarget) {
  const kind = getModality(modality).kind;
  if (session) {
    return {
      date: toDateKey(new Date(session.startedAt)),
      time: formatTime(session.startedAt),
      duration: durationText(session.durationSeconds ?? 0, kind),
      distance: session.distanceKm ? String(session.distanceKm) : '',
      sessionType: session.sessionType ?? '',
      rounds: session.rounds,
      intensity: session.intensity,
      heartRate: session.avgHeartRate,
      notes: session.notes ?? '',
    };
  }
  const minutes = plan?.targetMinutes ?? (kind === 'distancia' ? 30 : 60);
  // Começo padrão: agora menos a duração (quem registra costuma ter acabado de treinar).
  const start = new Date(Date.now() - minutes * 60_000);
  start.setMinutes(start.getMinutes() - (start.getMinutes() % 5), 0, 0);
  return {
    date: toDateKey(start),
    time: formatTime(start),
    duration: durationText(minutes * 60, kind),
    distance: plan?.targetDistanceKm ? String(plan.targetDistanceKm) : '',
    sessionType: plan?.sessionType ?? '',
    rounds: null as number | null,
    intensity: null as number | null,
    heartRate: null as number | null,
    notes: '',
  };
}

function ActivityForm({
  target,
  onDone,
}: {
  target: ActivityTarget;
  onDone: (result: ActivityLogResult) => void;
}) {
  const modality = getModality(target.modality);
  const isDistance = modality.kind === 'distancia';
  const save = useSaveActivity();
  const [form, setForm] = useState(() => initialForm(target));

  const seconds = parseDuration(form.duration, modality.kind);
  const distance = numberOrNull(form.distance);
  const startedAt = new Date(`${form.date}T${form.time || '00:00'}`);
  const valid = seconds !== null && seconds >= 60 && !Number.isNaN(startedAt.getTime());
  const sessionTypes = [
    ...new Set([...modality.sessionTypes, ...(form.sessionType ? [form.sessionType] : [])]),
  ];

  const submit = async () => {
    if (!valid) return;
    const result = await save.mutateAsync({
      id: target.session?.id,
      modality: target.modality,
      routineId: target.session ? target.session.routineId : (target.plan?.id ?? null),
      startedAt: startedAt.toISOString(),
      durationSeconds: seconds,
      sessionType: form.sessionType || null,
      distanceKm: isDistance ? distance : null,
      rounds: isDistance ? null : form.rounds,
      intensity: form.intensity,
      avgHeartRate: form.heartRate,
      notes: form.notes || null,
    });
    if (result.newRecords.length)
      toast.success('Novo recorde! 🏆', describeActivityRecords(result.newRecords, target.modality));
    else if (!target.session)
      toast.success('Treino registrado', 'A Polaris marcou o hábito "Treino" do dia.');
    else toast.success('Treino atualizado');
    onDone(result);
  };

  return (
    <div className="space-y-4">
      {target.plan && (
        <p className="text-sm text-text-dim">
          Plano: <span className="text-text">{target.plan.name}</span>
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Data">
          {(id) => (
            <Input
              id={id}
              type="date"
              max={toDateKey()}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          )}
        </Field>
        <Field label="Início">
          {(id) => (
            <Input
              id={id}
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
            />
          )}
        </Field>
        <Field
          label={isDistance ? 'Tempo' : 'Duração'}
          hint={
            seconds
              ? `Entendido: ${formatDuration(seconds)}`
              : isDistance
                ? 'min:seg ou h:min:seg (ex.: 45:30)'
                : 'minutos ou h:min (ex.: 90 ou 1:30)'
          }
          error={form.duration && seconds === null ? 'Formato não reconhecido.' : undefined}
        >
          {(id) => (
            <Input
              id={id}
              inputMode="numeric"
              placeholder={isDistance ? '45:30' : '60'}
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
            />
          )}
        </Field>
        {isDistance ? (
          <Field
            label="Distância (km)"
            hint={
              distance && seconds
                ? `Pace ${formatPacePerKm(seconds / distance)} · ${formatNumber(distance / (seconds / 3600), 1)} km/h`
                : undefined
            }
          >
            {(id) => (
              <Input
                id={id}
                type="number"
                inputMode="decimal"
                min={0}
                step={0.01}
                placeholder="5"
                value={form.distance}
                onChange={(e) => setForm({ ...form, distance: e.target.value })}
              />
            )}
          </Field>
        ) : (
          <NumberField
            label={modality.roundsLabel ?? 'Rounds'}
            value={form.rounds}
            onChange={(rounds) => setForm({ ...form, rounds: rounds === null ? null : Math.round(rounds) })}
          />
        )}
      </div>

      <Field label="Tipo de treino">
        {(id) => (
          <Select
            id={id}
            value={form.sessionType}
            onChange={(e) => setForm({ ...form, sessionType: e.target.value })}
          >
            <option value="">Sem tipo</option>
            {sessionTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </Select>
        )}
      </Field>

      <div>
        <p className="label-mono mb-2 text-text-dim">
          Intensidade
          {form.intensity ? ` · ${form.intensity}/10 ${INTENSITY_LABELS[form.intensity]}` : ' (opcional)'}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={form.intensity === value}
              aria-label={`Intensidade ${value} de 10`}
              onClick={() => setForm({ ...form, intensity: form.intensity === value ? null : value })}
              className={cn(
                'h-9 w-9 rounded-lg border font-mono text-sm transition-all',
                form.intensity !== null && value <= form.intensity
                  ? 'border-primary bg-primary/20 text-star shadow-[0_0_10px_rgba(56,189,248,0.35)]'
                  : 'border-border text-text-dim hover:border-primary/70 hover:text-star',
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {isDistance && (
        <NumberField
          label="FC média (bpm, opcional)"
          value={form.heartRate}
          onChange={(heartRate) =>
            setForm({ ...form, heartRate: heartRate === null ? null : Math.round(heartRate) })
          }
        />
      )}

      <Field label="Notas">
        {(id) => (
          <Textarea
            id={id}
            rows={3}
            placeholder={
              isDistance
                ? 'Como foi? Percurso, clima, sensações…'
                : 'O que você treinou? Técnicas, posições, sensações…'
            }
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        )}
      </Field>

      <Button
        variant="primary"
        icon={Save}
        className="w-full justify-center"
        loading={save.isPending}
        disabled={!valid}
        onClick={() => void submit()}
      >
        {target.session ? 'Salvar alterações' : 'Registrar treino'}
      </Button>
    </div>
  );
}
