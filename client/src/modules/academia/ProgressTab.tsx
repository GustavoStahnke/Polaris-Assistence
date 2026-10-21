import type { ModalityId } from '@polaris/shared';
import { LineChart as LineChartIcon, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartFrame } from '../../components/ui/ChartFrame';
import { EmptyState } from '../../components/ui/EmptyState';
import { Select } from '../../components/ui/Input';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { Tabs } from '../../components/ui/Tabs';
import { axisProps, CHART_COLORS, gridProps, tooltipProps } from '../../lib/chartTheme';
import { formatDayMonth, formatNumber, formatShortDate } from '../../lib/format';
import { ActivityProgress } from './ActivityProgress';
import { useEnabledModalities, useExercises, useProgress, useRecords } from './api';
import { ModalityChips } from './ModalityChips';
import { RecordList } from './RecordList';

/** Evolução: escolhe a modalidade e mostra os gráficos que fazem sentido para ela. */
export function ProgressTab() {
  const modalities = useEnabledModalities();
  const [chosen, setChosen] = useState<ModalityId | null>(null);
  const modality = modalities.find((m) => m.id === chosen) ?? modalities[0]!;
  return (
    <>
      {modalities.length > 1 && (
        <ModalityChips modalities={modalities} value={modality.id} onChange={setChosen} className="mb-4" />
      )}
      {modality.kind === 'forca' ? (
        <StrengthProgress key={modality.id} modality={modality.id} />
      ) : (
        <ActivityProgress key={modality.id} modality={modality.id} />
      )}
    </>
  );
}

type Metric = 'maxWeight' | 'oneRm' | 'volume' | 'maxReps' | 'totalReps';
const WEIGHT_METRICS: Array<{ id: Metric; label: string }> = [
  { id: 'maxWeight', label: 'Carga máxima' },
  { id: 'oneRm', label: '1RM estimado' },
  { id: 'volume', label: 'Volume' },
];

/** Gráfico por exercício e recordes das modalidades de força. */
function StrengthProgress({ modality }: { modality: ModalityId }) {
  const records = useRecords();
  const exercises = useExercises();
  const byId = useMemo(() => new Map((exercises.data ?? []).map((e) => [e.id, e])), [exercises.data]);
  const ownRecords = useMemo(
    () => (records.data ?? []).filter((r) => byId.get(r.exerciseId)?.modality === modality),
    [records.data, byId, modality],
  );
  const exercisesWithData = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of ownRecords) map.set(r.exerciseId, r.exerciseName);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [ownRecords]);
  const [chosen, setChosen] = useState<string | null>(null);
  const exerciseId = chosen ?? exercisesWithData[0]?.[0] ?? null;
  const progress = useProgress(exerciseId);
  const [chosenMetric, setMetric] = useState<Metric>('maxWeight');

  // Com carga: carga, 1RM e volume. Só com o peso do corpo: repetições (ou segundos).
  const timed = byId.get(exerciseId ?? '')?.measure === 'tempo';
  const repUnit = timed ? 's' : 'reps';
  const weighted = progress.data?.points.some((p) => p.maxWeight > 0) ?? false;
  const metrics: Array<{ id: Metric; label: string }> = weighted
    ? WEIGHT_METRICS
    : [
        { id: 'maxReps', label: timed ? 'Maior tempo' : 'Máx. por série' },
        { id: 'totalReps', label: timed ? 'Tempo total' : 'Total no treino' },
      ];
  const metric = metrics.some((m) => m.id === chosenMetric) ? chosenMetric : metrics[0]!.id;
  const metricInfo = metrics.find((m) => m.id === metric)!;
  const unit = weighted ? 'kg' : repUnit;

  if (!records.isPending && exercisesWithData.length === 0) {
    return (
      <div className="glass">
        <EmptyState
          icon={LineChartIcon}
          title="Sem dados de evolução ainda"
          message="Finalize alguns treinos e a Polaris desenha seus gráficos e recordes aqui."
        />
      </div>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <PolarisCard
        icon={LineChartIcon}
        label="Evolução · Exercício"
        title={progress.data?.exercise.name ?? '…'}
      >
        <div className="mb-4 flex flex-wrap gap-3">
          <Select
            value={exerciseId ?? ''}
            onChange={(e) => setChosen(e.target.value)}
            aria-label="Exercício"
            className="w-auto min-w-56"
          >
            {exercisesWithData.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
          <Tabs tabs={metrics} value={metric} onChange={setMetric} />
        </div>
        {(progress.data?.points.length ?? 0) < 2 && (
          <p className="mb-2 text-sm text-text-dim">
            Com dois ou mais treinos deste exercício, a linha de evolução aparece.
          </p>
        )}
        <ChartFrame height={280}>
          <LineChart data={progress.data?.points ?? []} margin={{ top: 10, right: 16, bottom: 0, left: -8 }}>
            <CartesianGrid {...gridProps} />
            <XAxis
              dataKey="date"
              {...axisProps}
              tickFormatter={(d: string) => formatDayMonth(`${d}T12:00:00`)}
            />
            <YAxis {...axisProps} width={48} />
            <Tooltip
              {...tooltipProps}
              labelFormatter={(d) => formatShortDate(`${String(d)}T12:00:00`)}
              formatter={(v) => [`${formatNumber(Number(v), 1)} ${unit}`, metricInfo.label]}
            />
            <Line
              type="monotone"
              dataKey={metric}
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              dot={{ r: 4, fill: CHART_COLORS.primary, stroke: '#061026', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: CHART_COLORS.star, stroke: '#061026', strokeWidth: 2 }}
            />
          </LineChart>
        </ChartFrame>
      </PolarisCard>

      <PolarisCard icon={Trophy} label="Evolução · Recordes" title="Recordes pessoais">
        <RecordList records={ownRecords} />
      </PolarisCard>
    </div>
  );
}
