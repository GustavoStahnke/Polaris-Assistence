import type { CityLocation, TemperatureUnit, WeatherData } from '@polaris/shared';
import { ExternalServiceError, getJson } from '../http';

interface GeocodingResponse {
  results?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
    timezone?: string;
  }>;
}

/** Busca cidades pelo nome (API de geocoding do Open-Meteo). */
export async function searchCities(query: string): Promise<CityLocation[]> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', query);
  url.searchParams.set('count', '8');
  url.searchParams.set('language', 'pt');
  url.searchParams.set('format', 'json');
  const data = await getJson<GeocodingResponse>(url.toString());
  return (data.results ?? []).map((r) => ({
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    country: r.country,
    admin1: r.admin1,
    timezone: r.timezone,
  }));
}

interface ForecastResponse {
  utc_offset_seconds: number;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: Array<number | null>;
    weather_code: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: Array<number | null>;
    precipitation_sum: Array<number | null>;
    sunrise: string[];
    sunset: string[];
  };
}

/** O Open-Meteo devolve horários locais da cidade; aqui viram ISO UTC. */
const toIsoUtc = (localTime: string, offsetSeconds: number) =>
  new Date(Date.parse(`${localTime}:00Z`) - offsetSeconds * 1000).toISOString();

/** Previsão completa: agora, próximas 24 horas e 7 dias. */
export async function fetchForecast(
  location: CityLocation,
  units: TemperatureUnit,
  now: Date = new Date(),
): Promise<WeatherData> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(location.latitude));
  url.searchParams.set('longitude', String(location.longitude));
  url.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m',
  );
  url.searchParams.set('hourly', 'temperature_2m,precipitation_probability,weather_code');
  url.searchParams.set(
    'daily',
    'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset',
  );
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '7');
  url.searchParams.set('wind_speed_unit', 'kmh');
  url.searchParams.set('temperature_unit', units);

  const data = await getJson<ForecastResponse>(url.toString());
  if (!data.current || !data.hourly || !data.daily) {
    throw new ExternalServiceError('O Open-Meteo respondeu sem dados de previsão.');
  }
  const offset = data.utc_offset_seconds ?? 0;

  const hourly = data.hourly.time
    .map((time, i) => ({
      time: toIsoUtc(time, offset),
      temperature: data.hourly.temperature_2m[i] ?? 0,
      precipitationProbability: data.hourly.precipitation_probability[i] ?? 0,
      weatherCode: data.hourly.weather_code[i] ?? 0,
    }))
    .filter((h) => new Date(h.time).getTime() >= now.getTime() - 3600_000)
    .slice(0, 24);

  const daily = data.daily.time.map((date, i) => ({
    date,
    min: data.daily.temperature_2m_min[i] ?? 0,
    max: data.daily.temperature_2m_max[i] ?? 0,
    weatherCode: data.daily.weather_code[i] ?? 0,
    precipitationProbability: data.daily.precipitation_probability_max[i] ?? 0,
    precipitationSum: data.daily.precipitation_sum[i] ?? 0,
  }));

  return {
    location,
    units,
    current: {
      time: toIsoUtc(data.current.time, offset),
      temperature: data.current.temperature_2m,
      apparentTemperature: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      windSpeed: data.current.wind_speed_10m,
      windDirection: data.current.wind_direction_10m,
      weatherCode: data.current.weather_code,
      isDay: data.current.is_day === 1,
      precipitation: data.current.precipitation,
    },
    today: {
      min: daily[0]?.min ?? data.current.temperature_2m,
      max: daily[0]?.max ?? data.current.temperature_2m,
      precipitationProbability: daily[0]?.precipitationProbability ?? 0,
      sunrise: data.daily.sunrise[0] ? toIsoUtc(data.daily.sunrise[0], offset) : null,
      sunset: data.daily.sunset[0] ? toIsoUtc(data.daily.sunset[0], offset) : null,
    },
    hourly,
    daily,
  };
}
