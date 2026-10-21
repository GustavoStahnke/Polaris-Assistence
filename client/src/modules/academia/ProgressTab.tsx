import { PR_TYPE_LABELS, type PersonalRecord } from '@polaris/shared';
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
import { useProgress, useRecords } from './api';

type Metric = 'maxWeight' | 'oneRm' | 'volume';
const METRICS: Array<{ id: Metric; label: string; unit: string }> = [
  { id: 'maxWeight', label: 'Carga máxima', unit: 'kg' },
  { id: 'oneRm', label: '1RM estimado', unit: 'kg' },
  { id: 'volume', label: 'Volume', unit: 'kg' },
];

export function ProgressTab() {
  const records = useRecords();
  const exercisesWithData = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of records.data ?? []) map.set(r.exerciseId, r.exerciseName);
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [records.data]);
  const [chosen, setChosen] = useState<string | null>(null);
  const exerciseId = chosen ?? exercisesWithData[0]?.[0] ?? null;
  const [metric, setMetric] = useState<Metric>('maxWeight');
  const progress = useProgress(exerciseId);
  const metricInfo = METRICS.find((m) => m.id === metric)!;

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
          <Tabs tabs={METRICS} value={metric} onChange={setMetric} />
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
              formatter={(v) => [`${formatNumber(Number(v), 1)} ${metricInfo.unit}`, metricInfo.label]}
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
        <RecordList records={records.data ?? []} />
      </PolarisCard>
    </div>
  );
}

/** Lista de recordes com brilho dourado-estelar. */
export function RecordList({ records }: { records: PersonalRecord[] }) {
  if (records.length === 0) return <p className="text-sm text-text-dim">Nenhum recorde ainda.</p>;
  return (
    <ul className="space-y-2">
      {records.map((r) => (
        <li
          key={r.id}
          className="flex items-center gap-3 rounded-xl border border-star/40 bg-star/5 p-3 shadow-[0_0_calc(18px*var(--glow-strength))_rgba(165,243,252,calc(0.18*var(--glow-strength)))]"
        >
          <Trophy
            className="h-4 w-4 shrink-0 text-star drop-shadow-[0_0_6px_rgba(165,243,252,0.9)]"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{r.exerciseName}</p>
            <p className="text-xs text-text-dim">
              {PR_TYPE_LABELS[r.type]} · {formatShortDate(r.achievedAt)}
            </p>
          </div>
          <span className="font-mono text-sm text-star">
            {formatNumber(r.value, 1)} kg
            {r.type !== 'max_1rm' && (
              <span className="text-text-dim">
                {' '}
                ({r.weight}×{r.reps})
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
