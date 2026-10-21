import { formatPace, getModality, type ModalityId } from '@polaris/shared';
import { BarChart3, ClipboardPen, Gauge, PieChart, Trophy } from 'lucide-react';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '../../components/ui/Button';
import { ChartFrame } from '../../components/ui/ChartFrame';
import { EmptyState } from '../../components/ui/EmptyState';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { axisProps, CHART_COLORS, gridProps, tooltipProps } from '../../lib/chartTheme';
import { formatDayMonth, formatDuration, formatNumber, formatShortDate } from '../../lib/format';
import { ActivityLogModal, type ActivityTarget } from './ActivityLogModal';
import { useModalityStats } from './api';
import { activityRecordLabel, formatActivityRecord, formatKm, modalityIcon } from './modality';
import { RecordRow } from './RecordList';

const dayLabel = (date: string) => formatDayMonth(`${date}T12:00:00`);

/** Evolução de corrida, caminhada e lutas: totais, semanas, pace, tipos e recordes. */
export function ActivityProgress({ modality: modalityId }: { modality: ModalityId }) {
  const stats = useModalityStats(modalityId);
  const modality = getModality(modalityId);
  const isDistance = modality.kind === 'distancia';
  const roundsLabel = modality.roundsLabel ?? 'Rounds';
  const [logTarget, setLogTarget] = useState<ActivityTarget | null>(null);
  const data = stats.data;
  const logModal = <ActivityLogModal target={logTarget} onClose={() => setLogTarget(null)} />;

  if (stats.isPending) return <PolarisCard label={`Evolução · ${modality.name}`} state="loading" />;
  if (!data || data.total.sessions === 0) {
    return (
      <div className="glass">
        <EmptyState
          icon={modalityIcon(modalityId)}
          title={`Nenhum treino de ${modality.name} ainda`}
          message="Registre o primeiro e a Polaris desenha sua evolução aqui."
          action={
            <Button
              variant="primary"
              icon={ClipboardPen}
              onClick={() => setLogTarget({ modality: modalityId })}
            >
              Registrar {modality.name}
            </Button>
          }
        />
        {logModal}
      </div>
    );
  }

  const tiles = isDistance
    ? [
        { label: 'Treinos', value: formatNumber(data.total.sessions) },
        { label: 'Distância total', value: formatKm(data.total.distanceKm) },
        { label: 'Tempo total', value: formatDuration(data.total.durationSeconds) },
        { label: 'Este mês', value: `${data.month.sessions} · ${formatKm(data.month.distanceKm)}` },
      ]
    : [
        { label: 'Treinos', value: formatNumber(data.total.sessions) },
        { label: 'Tempo de treino', value: formatDuration(data.total.durationSeconds) },
        { label: `${roundsLabel} no total`, value: formatNumber(data.total.rounds) },
        {
          label: 'Este mês',
          value: `${data.month.sessions} · ${formatDuration(data.month.durationSeconds)}`,
        },
      ];
  const paces = data.recent.filter((r) => r.paceSeconds !== null && (r.distanceKm ?? 0) >= 1);
  const totalTyped = data.byType.reduce((sum, t) => sum + t.count, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="glass px-4 py-3">
            <p className="label-mono text-text-dim">{tile.label}</p>
            <p className="mt-1 font-display text-xl font-bold text-star glow-text tabular-nums">
              {tile.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <PolarisCard
            icon={BarChart3}
            label={`${modality.name} · Últimas 12 semanas`}
            title={isDistance ? 'Quilômetros por semana' : 'Minutos por semana'}
          >
            <ChartFrame height={240}>
              <BarChart data={data.weeks} margin={{ top: 10, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="weekStart" {...axisProps} tickFormatter={dayLabel} minTickGap={12} />
                <YAxis {...axisProps} width={44} allowDecimals={isDistance} />
                <Tooltip
                  {...tooltipProps}
                  cursor={{ fill: 'rgba(56,189,248,0.08)' }}
                  labelFormatter={(d) => `Semana de ${dayLabel(String(d))}`}
                  formatter={(v) =>
                    isDistance
                      ? [formatKm(Number(v)), 'Distância']
                      : [`${formatNumber(Number(v))} min`, 'Treino']
                  }
                />
                <Bar
                  dataKey={isDistance ? 'distanceKm' : 'minutes'}
                  fill={CHART_COLORS.primary}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
              </BarChart>
            </ChartFrame>
          </PolarisCard>

          {isDistance && (
            <PolarisCard icon={Gauge} label={`${modality.name} · Ritmo`} title="Pace por treino">
              {paces.length < 2 ? (
                <p className="text-sm text-text-dim">
                  Com dois ou mais treinos de pelo menos 1 km, a linha do pace aparece. Quanto mais alto, mais
                  rápido.
                </p>
              ) : (
                <ChartFrame height={240}>
                  <LineChart data={paces} margin={{ top: 10, right: 16, bottom: 0, left: -8 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="date" {...axisProps} tickFormatter={dayLabel} minTickGap={12} />
                    {/* Eixo invertido: pace menor (mais rápido) fica em cima. */}
                    <YAxis
                      {...axisProps}
                      width={48}
                      reversed
                      domain={['dataMin - 15', 'dataMax + 15']}
                      tickFormatter={(v: number) => formatPace(v)}
                    />
                    <Tooltip
                      {...tooltipProps}
                      labelFormatter={(d) => formatShortDate(`${String(d)}T12:00:00`)}
                      formatter={(v) => [`${formatPace(Number(v))} /km`, 'Pace']}
                    />
                    <Line
                      type="monotone"
                      dataKey="paceSeconds"
                      stroke={CHART_COLORS.primary}
                      strokeWidth={2}
                      dot={{ r: 4, fill: CHART_COLORS.primary, stroke: '#061026', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: CHART_COLORS.star, stroke: '#061026', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ChartFrame>
              )}
            </PolarisCard>
          )}
        </div>

        <div className="space-y-5">
          <PolarisCard icon={Trophy} label={`${modality.name} · Recordes`} title="Recordes pessoais">
            {data.records.length === 0 ? (
              <p className="text-sm text-text-dim">Nenhum recorde ainda.</p>
            ) : (
              <ul className="space-y-2">
                {data.records.map((r) => (
                  <RecordRow
                    key={r.type}
                    title={activityRecordLabel(r.type, modalityId)}
                    subtitle={formatShortDate(r.achievedAt)}
                    value={formatActivityRecord(r)}
                    to={`/academia/treino/${r.sessionId}`}
                  />
                ))}
              </ul>
            )}
          </PolarisCard>

          {data.byType.length > 0 && (
            <PolarisCard icon={PieChart} label={`${modality.name} · Tipos`} title="Como você treina">
              <ul className="space-y-3">
                {data.byType.map((t) => (
                  <li key={t.type}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{t.type}</span>
                      <span className="font-mono text-text-dim">{t.count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-primary/10">
                      <div
                        className="h-full rounded-full bg-primary shadow-[0_0_8px_rgba(56,189,248,0.6)]"
                        style={{ width: `${(t.count / totalTyped) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </PolarisCard>
          )}
        </div>
      </div>
      {logModal}
    </div>
  );
}
