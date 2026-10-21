import {
  describeWeather,
  isRainCode,
  type WeatherAlert,
  type WeatherData,
  type WeatherResponse,
} from '@polaris/shared';
import { getWeather } from './integrationService';

/** Alertas simples: chuva nas próximas horas, calor acima de 32° e frio abaixo de 10°. */
export function computeWeatherAlerts(weather: WeatherData, now: Date = new Date()): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const hourFormat = new Intl.DateTimeFormat('pt-BR', {
    hour: 'numeric',
    timeZone: weather.location.timezone,
  });
  const celsius = (v: number) => (weather.units === 'fahrenheit' ? ((v - 32) * 5) / 9 : v);

  if (isRainCode(weather.current.weatherCode)) {
    alerts.push({
      kind: 'chuva',
      severity: 'warning',
      message: `${describeWeather(weather.current.weatherCode).label} agora em ${weather.location.name}.`,
    });
  } else {
    const limit = now.getTime() + 12 * 3600_000;
    const next = weather.hourly.find(
      (h) =>
        new Date(h.time).getTime() > now.getTime() &&
        new Date(h.time).getTime() <= limit &&
        (h.precipitationProbability >= 60 || isRainCode(h.weatherCode)),
    );
    if (next) {
      alerts.push({
        kind: 'chuva',
        severity: 'warning',
        message: `Vai chover às ${hourFormat.format(new Date(next.time))}h (${next.precipitationProbability}% de chance).`,
      });
    }
  }
  if (celsius(weather.today.max) > 32) {
    alerts.push({
      kind: 'calor',
      severity: 'warning',
      message: `Calor de ${Math.round(weather.today.max)}° hoje. Beba bastante água.`,
    });
  }
  if (celsius(weather.today.min) < 10) {
    alerts.push({
      kind: 'frio',
      severity: 'info',
      message: `Frio de ${Math.round(weather.today.min)}° hoje. Leve um casaco.`,
    });
  }
  return alerts;
}

/** Clima + alertas, prontos para a interface. */
export async function getWeatherReport(options?: { force?: boolean }): Promise<WeatherResponse> {
  const hub = await getWeather(options);
  return {
    state: hub.state,
    error: hub.error,
    fetchedAt: hub.fetchedAt,
    weather: hub.data,
    alerts: hub.data ? computeWeatherAlerts(hub.data) : [],
  };
}
