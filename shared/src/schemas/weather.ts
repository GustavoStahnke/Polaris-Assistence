import { z } from 'zod';

export const cityLocationSchema = z.object({
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  country: z.string().optional(),
  admin1: z.string().optional(),
  timezone: z.string().optional(),
});
export type CityLocation = z.infer<typeof cityLocationSchema>;

export type TemperatureUnit = 'celsius' | 'fahrenheit';

export interface WeatherData {
  location: CityLocation;
  units: TemperatureUnit;
  current: {
    time: string;
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    weatherCode: number;
    isDay: boolean;
    precipitation: number;
  };
  today: {
    min: number;
    max: number;
    precipitationProbability: number;
    sunrise: string | null;
    sunset: string | null;
  };
  /** Próximas 24 horas (horários em ISO UTC). */
  hourly: Array<{ time: string; temperature: number; precipitationProbability: number; weatherCode: number }>;
  /** Próximos 7 dias (date = YYYY-MM-DD). */
  daily: Array<{
    date: string;
    min: number;
    max: number;
    weatherCode: number;
    precipitationProbability: number;
    precipitationSum: number;
  }>;
}

export interface WeatherAlert {
  kind: 'chuva' | 'calor' | 'frio';
  message: string;
  severity: 'info' | 'warning';
}

/** Descrição em pt-BR, ícone (lucide) e adjetivo curto para cada código WMO do Open-Meteo. */
const WMO: Record<number, { label: string; icon: string; short: string }> = {
  0: { label: 'Céu limpo', icon: 'Sun', short: 'ensolarado' },
  1: { label: 'Predominantemente limpo', icon: 'Sun', short: 'ensolarado' },
  2: { label: 'Parcialmente nublado', icon: 'CloudSun', short: 'parcialmente nublado' },
  3: { label: 'Nublado', icon: 'Cloud', short: 'nublado' },
  45: { label: 'Neblina', icon: 'CloudFog', short: 'com neblina' },
  48: { label: 'Neblina com geada', icon: 'CloudFog', short: 'com neblina' },
  51: { label: 'Garoa fraca', icon: 'CloudDrizzle', short: 'com garoa' },
  53: { label: 'Garoa moderada', icon: 'CloudDrizzle', short: 'com garoa' },
  55: { label: 'Garoa intensa', icon: 'CloudDrizzle', short: 'com garoa' },
  56: { label: 'Garoa congelante fraca', icon: 'CloudDrizzle', short: 'com garoa' },
  57: { label: 'Garoa congelante intensa', icon: 'CloudDrizzle', short: 'com garoa' },
  61: { label: 'Chuva fraca', icon: 'CloudRain', short: 'chuvoso' },
  63: { label: 'Chuva moderada', icon: 'CloudRain', short: 'chuvoso' },
  65: { label: 'Chuva forte', icon: 'CloudRain', short: 'chuva forte' },
  66: { label: 'Chuva congelante fraca', icon: 'CloudRain', short: 'chuvoso' },
  67: { label: 'Chuva congelante forte', icon: 'CloudRain', short: 'chuva forte' },
  71: { label: 'Neve fraca', icon: 'CloudSnow', short: 'com neve' },
  73: { label: 'Neve moderada', icon: 'CloudSnow', short: 'com neve' },
  75: { label: 'Neve forte', icon: 'CloudSnow', short: 'com neve' },
  77: { label: 'Grãos de neve', icon: 'CloudSnow', short: 'com neve' },
  80: { label: 'Pancadas de chuva fracas', icon: 'CloudRain', short: 'com pancadas de chuva' },
  81: { label: 'Pancadas de chuva moderadas', icon: 'CloudRain', short: 'com pancadas de chuva' },
  82: { label: 'Pancadas de chuva fortes', icon: 'CloudRain', short: 'chuva forte' },
  85: { label: 'Pancadas de neve fracas', icon: 'CloudSnow', short: 'com neve' },
  86: { label: 'Pancadas de neve fortes', icon: 'CloudSnow', short: 'com neve' },
  95: { label: 'Trovoada', icon: 'CloudLightning', short: 'com trovoadas' },
  96: { label: 'Trovoada com granizo fraco', icon: 'CloudLightning', short: 'com trovoadas' },
  99: { label: 'Trovoada com granizo forte', icon: 'CloudLightning', short: 'com trovoadas' },
};

export function describeWeather(code: number, isDay = true): { label: string; icon: string; short: string } {
  const info = WMO[code] ?? { label: 'Condição desconhecida', icon: 'Cloud', short: '' };
  if (!isDay && info.icon === 'Sun') return { ...info, icon: 'Moon', short: 'céu limpo' };
  if (!isDay && info.icon === 'CloudSun') return { ...info, icon: 'CloudMoon' };
  return info;
}

/** Códigos que indicam chuva (garoa, chuva, pancadas ou trovoada). */
export const isRainCode = (code: number) =>
  (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;

export interface WeatherResponse {
  state: 'ok' | 'stale' | 'error' | 'not_configured' | 'disabled';
  error: string | null;
  fetchedAt: string | null;
  weather: WeatherData | null;
  alerts: WeatherAlert[];
}

/** Alerta exibido no topo do Painel (clima, agenda, e-mails...). */
export interface DashboardAlert {
  id: string;
  source: 'clima' | 'agenda' | 'email' | 'tarefas';
  message: string;
  severity: 'info' | 'warning';
  to: string;
}
