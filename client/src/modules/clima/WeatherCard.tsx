import { describeWeather } from '@polaris/shared';
import { CloudRain, CloudSun, Droplets, Wind } from 'lucide-react';
import { Link } from 'react-router';
import { Badge } from '../../components/ui/Badge';
import { CountUp } from '../../components/ui/CountUp';
import { DynamicIcon } from '../../components/ui/DynamicIcon';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { formatRelative } from '../../lib/format';
import { useWeather } from './api';
import { integrationsPath } from '../../lib/paths';

/** Card "Clima" do Painel. */
export function WeatherCard({ index, className }: { index?: number; className?: string }) {
  const query = useWeather();
  const report = query.data;
  const weather = report?.weather;
  const info = weather ? describeWeather(weather.current.weatherCode, weather.current.isDay) : null;
  const rainAlert = report?.alerts.find((a) => a.kind === 'chuva');

  const state = query.isPending
    ? 'loading'
    : weather
      ? 'ready'
      : report?.state === 'not_configured' || report?.state === 'disabled'
        ? 'empty'
        : 'error';

  return (
    <PolarisCard
      index={index}
      className={className}
      icon={CloudSun}
      label="Panorama · Clima"
      title={weather?.location.name ?? 'Clima'}
      badge={
        report?.state === 'stale' ? (
          <Badge tone="warning">Cache</Badge>
        ) : weather ? (
          <Badge>Agora</Badge>
        ) : undefined
      }
      state={state}
      emptyTitle="Escolha sua cidade"
      emptyMessage="Configure o Open-Meteo para ver o clima aqui."
      emptyAction={
        <Link to={integrationsPath('open-meteo')} className="label-mono text-primary hover:text-star">
          Configurar →
        </Link>
      }
      errorMessage={report?.error ?? 'Não foi possível carregar o clima.'}
      footer={report?.fetchedAt ? `Open-Meteo · ${formatRelative(report.fetchedAt)}` : 'Open-Meteo'}
      to="/clima"
    >
      {weather && info && (
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <DynamicIcon
              name={info.icon}
              className="h-12 w-12 text-star drop-shadow-[0_0_10px_rgba(165,243,252,0.6)]"
            />
            <span className="font-display text-5xl font-bold text-star glow-text">
              <CountUp value={Math.round(weather.current.temperature)} />°
            </span>
            <div className="text-sm">
              <p className="text-text">{info.label}</p>
              <p className="text-text-dim">
                Mín {Math.round(weather.today.min)}° · Máx {Math.round(weather.today.max)}°
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-dim">
            <span>Sensação {Math.round(weather.current.apparentTemperature)}°</span>
            <span className="flex items-center gap-1">
              <Droplets className="h-3 w-3" aria-hidden /> {weather.current.humidity}%
            </span>
            <span className="flex items-center gap-1">
              <Wind className="h-3 w-3" aria-hidden /> {Math.round(weather.current.windSpeed)} km/h
            </span>
          </div>
          {rainAlert && (
            <p className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
              <CloudRain className="h-4 w-4 shrink-0" aria-hidden /> {rainAlert.message}
            </p>
          )}
        </div>
      )}
    </PolarisCard>
  );
}
