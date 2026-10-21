import { toDateKey, type BodyMeasurementInput } from '@polaris/shared';
import { Ruler, Save, Scale, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '../../components/ui/Button';
import { ChartFrame } from '../../components/ui/ChartFrame';
import { Field, Input } from '../../components/ui/Input';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { axisProps, CHART_COLORS, gridProps, tooltipProps } from '../../lib/chartTheme';
import { formatDayMonth, formatNumber, formatShortDate } from '../../lib/format';
import { useCreateMeasurement, useDeleteMeasurement, useMeasurements } from './api';
import { NumberField } from './RoutinesTab';

const FIELDS: Array<{ key: keyof BodyMeasurementInput; label: string }> = [
  { key: 'weightKg', label: 'Peso (kg)' },
  { key: 'bodyFatPercent', label: 'Gordura (%)' },
  { key: 'waistCm', label: 'Cintura (cm)' },
  { key: 'chestCm', label: 'Peito (cm)' },
  { key: 'hipsCm', label: 'Quadril (cm)' },
  { key: 'armCm', label: 'Braço (cm)' },
  { key: 'thighCm', label: 'Coxa (cm)' },
];

export function BodyTab() {
  const measurements = useMeasurements();
  const create = useCreateMeasurement();
  const remove = useDeleteMeasurement();
  const [form, setForm] = useState<BodyMeasurementInput>({ date: toDateKey() });
  const weights = [...(measurements.data ?? [])].filter((m) => m.weightKg !== null).reverse();

  const submit = async () => {
    await create.mutateAsync(form);
    setForm({ date: toDateKey() });
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <PolarisCard icon={Ruler} label="Corpo · Registrar" title="Novas medidas">
        <p className="mb-4 text-sm text-text-dim">Tudo é opcional: preencha só o que quiser acompanhar.</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Data" className="col-span-2">
            {(id) => (
              <Input
                id={id}
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            )}
          </Field>
          {FIELDS.map((f) => (
            <NumberField
              key={f.key}
              label={f.label}
              step={0.1}
              value={(form[f.key] as number | null | undefined) ?? null}
              onChange={(v) => setForm({ ...form, [f.key]: v })}
            />
          ))}
        </div>
        <Button
          className="mt-4"
          variant="primary"
          icon={Save}
          loading={create.isPending}
          onClick={() => void submit()}
        >
          Salvar medidas
        </Button>
      </PolarisCard>

      <div className="space-y-5">
        <PolarisCard
          icon={Scale}
          label="Corpo · Peso"
          title="Evolução do peso"
          state={measurements.isPending ? 'loading' : 'ready'}
        >
          {weights.length < 2 ? (
            <p className="text-sm text-text-dim">
              Registre o peso em dois dias diferentes para ver o gráfico.
            </p>
          ) : (
            <ChartFrame height={240}>
              <LineChart data={weights} margin={{ top: 10, right: 16, bottom: 0, left: -8 }}>
                <CartesianGrid {...gridProps} />
                <XAxis
                  dataKey="date"
                  {...axisProps}
                  tickFormatter={(d: string) => formatDayMonth(`${d}T12:00:00`)}
                />
                <YAxis {...axisProps} width={48} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip
                  {...tooltipProps}
                  labelFormatter={(d) => formatShortDate(`${String(d)}T12:00:00`)}
                  formatter={(v) => [`${formatNumber(Number(v), 1)} kg`, 'Peso']}
                />
                <Line
                  type="monotone"
                  dataKey="weightKg"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  dot={{ r: 4, fill: CHART_COLORS.primary, stroke: '#061026', strokeWidth: 2 }}
                />
              </LineChart>
            </ChartFrame>
          )}
        </PolarisCard>

        <PolarisCard icon={Ruler} label="Corpo · Registros" title="Histórico de medidas">
          {measurements.data?.length === 0 ? (
            <p className="text-sm text-text-dim">Nenhuma medida registrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="label-mono text-left text-text-dim">
                    <th className="py-2 pr-3 font-normal">Data</th>
                    {FIELDS.map((f) => (
                      <th key={f.key} className="py-2 pr-3 font-normal whitespace-nowrap">
                        {f.label}
                      </th>
                    ))}
                    <th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {measurements.data?.map((m) => (
                    <tr key={m.id}>
                      <td className="py-2 pr-3 font-mono whitespace-nowrap">
                        {formatShortDate(`${m.date}T12:00:00`)}
                      </td>
                      {FIELDS.map((f) => {
                        const value = m[f.key as keyof typeof m];
                        return (
                          <td key={f.key} className="py-2 pr-3 font-mono text-text-dim">
                            {typeof value === 'number' ? formatNumber(value, 1) : '—'}
                          </td>
                        );
                      })}
                      <td>
                        <Button
                          size="icon"
                          variant="ghost"
                          icon={Trash2}
                          aria-label="Apagar registro"
                          onClick={() => remove.mutate(m.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </PolarisCard>
      </div>
    </div>
  );
}
