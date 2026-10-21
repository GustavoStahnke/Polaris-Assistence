import { describeWeather, fromDateKey, type WeatherData } from '@polaris/shared';
import {
  AlertTriangle,
  CalendarRange,
  CloudSun,
  Droplets,
  RefreshCw,
  Sunrise,
  Sunset,
  Thermometer,
  Umbrella,
  Wind,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { Bar, BarChart, CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ChartFrame } from '../../components/ui/ChartFrame';
import { CountUp } from '../../components/ui/CountUp';
import { DynamicIcon } from '../../components/ui/DynamicIcon';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { axisProps, CHART_COLORS, gridProps, tooltipProps } from '../../lib/chartTheme';
import { capitalize, formatRelative, formatTime, formatWeekdayShort } from '../../lib/format';
import { useRefreshWeather, useWeather } from './api';
import { integrationsPath } from '../../lib/paths';

export function ClimaPage() {
  const query = useWeather();
  const refresh = useRefreshWeather();
  const report = query.data;
  const weather = report?.weather;

  return (
    <>
      <PageHeader
        label="Panorama · Clima"
        title="Clima"
        actions={
          <Button icon={RefreshCw} loading={refresh.isPending} onClick={() => refresh.mutate()}>
            Atualizar
          </Button>
        }
      />
      {query.isPending ? (
        <PolarisCard label="Clima · Agora" state="loading" />
      ) : !weather ? (
        <div className="glass">
          <EmptyState
            icon={CloudSun}
            title={report?.state === 'error' ? 'Não foi possível carregar o clima' : 'Escolha sua cidade'}
            message={report?.error ?? 'Configure o Open-Meteo em Integrações para ver a previsão.'}
            action={
              <Link to={integrationsPath('open-meteo')} className="label-mono text-primary hover:text-star">
                Abrir Integrações →
              </Link>
            }
          />
        </div>
      ) : (
        <WeatherView
          weather={weather}
          alerts={report.alerts.map((a) => a.message)}
          stale={report.state === 'stale'}
          fetchedAt={report.fetchedAt}
        />
      )}
    </>
  );
}

function WeatherView({
  weather,
  alerts,
  stale,
  fetchedAt,
}: {
  weather: WeatherData;
  alerts: string[];
  stale: boolean;
  fetchedAt: string | null;
}) {
  const info = describeWeather(weather.current.weatherCode, weather.current.isDay);
  const hourly = weather.hourly.map((h) => ({ ...h, label: formatTime(h.time) }));

  return (
    <div className="space-y-5">
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alerts.map((a) => (
            <p
              key={a}
              className="flex items-center gap-2 rounded-full border border-warning/40 bg-warning/10 px-3.5 py-1.5 text-sm text-warning"
            >
              <AlertTriangle className="h-4 w-4" aria-hidden /> {a}
            </p>
          ))}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <PolarisCard
          icon={CloudSun}
          label="Clima · Agora"
          title={[weather.location.name, weather.location.admin1].filter(Boolean).join(', ')}
          badge={stale ? <Badge tone="warning">Dado em cache</Badge> : <Badge>Ao vivo</Badge>}
          footer={fetchedAt ? `Open-Meteo · atualizado ${formatRelative(fetchedAt)}` : undefined}
        >
          <div className="flex flex-wrap items-center gap-6">
            <DynamicIcon
              name={info.icon}
              className="h-20 w-20 text-star drop-shadow-[0_0_16px_rgba(165,243,252,0.6)]"
            />
            <div>
              <p className="font-display text-7xl font-bold text-star glow-text">
                <CountUp value={Math.round(weather.current.temperature)} />°
              </p>
              <p className="text-lg">{info.label}</p>
              <p className="text-sm text-text-dim">
                Mín {Math.round(weather.today.min)}° · Máx {Math.round(weather.today.max)}°
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Metric
              icon={Thermometer}
              label="Sensação"
              value={`${Math.round(weather.current.apparentTemperature)}°`}
            />
            <Metric icon={Droplets} label="Umidade" value={`${weather.current.humidity}%`} />
            <Metric icon={Wind} label="Vento" value={`${Math.round(weather.current.windSpeed)} km/h`} />
            <Metric icon={Umbrella} label="Chuva hoje" value={`${weather.today.precipitationProbability}%`} />
            {weather.today.sunrise && (
              <Metric icon={Sunrise} label="Nascer do sol" value={formatTime(weather.today.sunrise)} />
            )}
            {weather.today.sunset && (
              <Metric icon={Sunset} label="Pôr do sol" value={formatTime(weather.today.sunset)} />
            )}
          </div>
        </PolarisCard>

        <PolarisCard icon={CalendarRange} label="Clima · 7 dias" title="Próximos dias">
          <ul className="divide-y divide-border/40">
            {weather.daily.map((day, i) => {
              const d = describeWeather(day.weatherCode);
              return (
                <li key={day.date} className="flex items-center gap-3 py-2.5">
                  <span className="w-14 font-mono text-sm text-text-dim">
                    {i === 0
                      ? 'Hoje'
                      : capitalize(formatWeekdayShort(fromDateKey(day.date)).replace('.', ''))}
                  </span>
                  <DynamicIcon name={d.icon} className="h-5 w-5 text-primary" />
                  <span className="flex-1 truncate text-sm">{d.label}</span>
                  <span className="flex items-center gap-1 text-xs text-text-dim">
                    <Umbrella className="h-3 w-3" aria-hidden /> {day.precipitationProbability}%
                  </span>
                  <span className="w-20 text-right font-mono text-sm">
                    <span className="text-text-dim">{Math.round(day.min)}°</span> / {Math.round(day.max)}°
                  </span>
                </li>
              );
            })}
          </ul>
        </PolarisCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <PolarisCard icon={Thermometer} label="Clima · 24 horas" title="Temperatura">
          <ChartFrame height={220}>
            <LineChart data={hourly} margin={{ top: 10, right: 12, bottom: 0, left: 4 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} interval={3} />
              <YAxis
                {...axisProps}
                width={40}
                domain={['dataMin - 2', 'dataMax + 2']}
                tickFormatter={(v: number) => `${Math.round(v)}°`}
              />
              <Tooltip {...tooltipProps} formatter={(v) => [`${Math.round(Number(v))}°`, 'Temperatura']} />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke={CHART_COLORS.primary}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: CHART_COLORS.star }}
              />
            </LineChart>
          </ChartFrame>
        </PolarisCard>
        <PolarisCard icon={Umbrella} label="Clima · 24 horas" title="Chance de chuva">
          <ChartFrame height={220}>
            <BarChart data={hourly} margin={{ top: 10, right: 12, bottom: 0, left: 4 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} interval={3} />
              <YAxis {...axisProps} width={40} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
              <Tooltip
                {...tooltipProps}
                cursor={{ fill: 'rgba(56,189,248,0.08)' }}
                formatter={(v) => [`${v}%`, 'Chuva']}
              />
              <Bar
                dataKey="precipitationProbability"
                fill={CHART_COLORS.secondary}
                radius={[4, 4, 0, 0]}
                maxBarSize={14}
              />
            </BarChart>
          </ChartFrame>
        </PolarisCard>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-bg-deep/40 p-3">
      <p className="label-mono flex items-center gap-1.5 text-[10px] text-text-dim">
        <Icon className="h-3.5 w-3.5 text-primary" aria-hidden /> {label}
      </p>
      <p className="mt-1 font-mono text-lg">{value}</p>
    </div>
  );
}
