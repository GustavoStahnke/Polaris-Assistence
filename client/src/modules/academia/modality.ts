import {
  ACTIVITY_RECORD_LABELS,
  formatPace,
  getModality,
  PR_TYPE_LABELS,
  type ActivityRecord,
  type ExerciseMeasure,
  type PrType,
  type Routine,
  type WorkoutSessionSummary,
} from '@polaris/shared';
import type { LucideIcon } from 'lucide-react';
import { formatDuration, formatNumber, plural } from '../../lib/format';
import { iconByName } from '../../lib/icons';

// Ajudantes de exibição das modalidades de treino (sem componentes React).

/** Ícone lucide da modalidade. */
export const modalityIcon = (id: string | null | undefined): LucideIcon => iconByName(getModality(id).icon);

/** 5.25 → "5,25 km" */
export const formatKm = (km: number) => `${formatNumber(km, 2)} km`;

/** 330 → "5:30 /km" */
export const formatPacePerKm = (secondsPerKm: number) => `${formatPace(secondsPerKm)} /km`;

/** Metas de um plano sem séries: "Aula · 60 min · 5 km". */
export function planTargets(routine: Routine): string {
  return [
    routine.sessionType,
    routine.targetMinutes && `${routine.targetMinutes} min`,
    routine.targetDistanceKm && formatKm(routine.targetDistanceKm),
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Valor de uma série: "40 kg × 10", "12 reps", "45 s" ou "+10 kg · 30 s". */
export function formatSetValue(set: { weight: number; reps: number; measure: ExerciseMeasure }) {
  if (set.measure === 'tempo') return set.weight > 0 ? `+${set.weight} kg · ${set.reps} s` : `${set.reps} s`;
  return set.weight > 0 ? `${set.weight} kg × ${set.reps}` : `${set.reps} reps`;
}

/** Nome do recorde de força ("Maior tempo" nas isometrias). */
export const prLabel = (type: PrType, measure: ExerciseMeasure) =>
  type === 'max_reps' && measure === 'tempo' ? 'Maior tempo' : PR_TYPE_LABELS[type];

/** Valor de um recorde de corrida, caminhada ou luta. */
export function formatActivityRecord(record: ActivityRecord): string {
  switch (record.type) {
    case 'max_distance':
      return formatKm(record.value);
    case 'best_pace':
      return formatPacePerKm(record.value);
    case 'max_duration':
      return formatDuration(record.value);
    case 'max_rounds':
      return formatNumber(record.value);
  }
}

/** Nome do recorde, com o termo da modalidade ("Mais rolas num treino" no Jiu-Jitsu). */
export const activityRecordLabel = (type: ActivityRecord['type'], modality: string) =>
  type === 'max_rounds'
    ? `Mais ${(getModality(modality).roundsLabel ?? 'rounds').toLowerCase()} num treino`
    : ACTIVITY_RECORD_LABELS[type];

/** "Maior distância: 8 km · Melhor pace: 5:37 /km" */
export const describeActivityRecords = (records: ActivityRecord[], modality: string) =>
  records.map((r) => `${activityRecordLabel(r.type, modality)}: ${formatActivityRecord(r)}`).join(' · ');

type SessionNumbers = Pick<
  WorkoutSessionSummary,
  'modality' | 'durationSeconds' | 'totalVolume' | 'distanceKm' | 'rounds' | 'intensity'
> & { totalReps?: number; sets?: number };

/** Números principais de um treino, conforme a modalidade (ex.: ["8 km", "45min 00s", "5:37 /km"]). */
export function sessionHighlights(s: SessionNumbers): string[] {
  const modality = getModality(s.modality);
  const duration = s.durationSeconds ? formatDuration(s.durationSeconds) : null;
  let parts: Array<string | null | false>;
  if (modality.kind === 'forca') {
    parts = [
      duration,
      modality.volumeUnit === 'reps'
        ? s.totalReps !== undefined && plural(s.totalReps, 'rep', 'reps')
        : `${formatNumber(s.totalVolume ?? 0)} kg`,
      s.sets !== undefined && plural(s.sets, 'série'),
    ];
  } else if (modality.kind === 'distancia') {
    parts = [
      s.distanceKm ? formatKm(s.distanceKm) : null,
      duration,
      s.distanceKm && s.durationSeconds ? formatPacePerKm(s.durationSeconds / s.distanceKm) : null,
    ];
  } else {
    parts = [
      duration,
      s.rounds ? `${s.rounds} ${(modality.roundsLabel ?? 'rounds').toLowerCase()}` : null,
      s.intensity ? `intensidade ${s.intensity}/10` : null,
    ];
  }
  return parts.filter((p): p is string => Boolean(p));
}
