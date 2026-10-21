import { cityLocationSchema, describeWeather, type WeatherData } from '@polaris/shared';
import { z } from 'zod';
import { defineIntegration, IntegrationConfigError, type DataSource } from '../types';
import { fetchForecast } from './api';

export const openMeteoConfigSchema = z.object({
  city: cityLocationSchema
    .nullable()
    .default(null)
    .meta({ title: 'Cidade', description: 'Digite o nome e escolha na lista.', widget: 'city-search' }),
  units: z
    .enum(['celsius', 'fahrenheit'])
    .default('celsius')
    .meta({
      title: 'Unidade de temperatura',
      enumLabels: { celsius: 'Celsius (°C)', fahrenheit: 'Fahrenheit (°F)' },
    }),
});
export type OpenMeteoConfig = z.infer<typeof openMeteoConfigSchema>;

/** Previsão do tempo da cidade configurada (cache de 30 minutos). */
export const weatherSource: DataSource<OpenMeteoConfig, WeatherData> = {
  key: (config) => `weather:${config.city?.latitude},${config.city?.longitude}:${config.units}`,
  ttlMinutes: 30,
  fetch: async ({ config }) => {
    if (!config.city) throw new IntegrationConfigError('Escolha uma cidade em Integrações › Open-Meteo.');
    return fetchForecast(config.city, config.units);
  },
};

export const openMeteo = defineIntegration<OpenMeteoConfig>({
  id: 'open-meteo',
  name: 'Open-Meteo',
  category: 'clima',
  description: 'Previsão do tempo gratuita e sem cadastro: agora, próximas horas e 7 dias.',
  icon: 'CloudSun',
  authType: 'none',
  availability: 'available',
  free: true,
  configSchema: openMeteoConfigSchema,
  syncIntervalMinutes: 30,
  isConfigured: (config) => config.city !== null,
  async test({ config }) {
    if (!config.city) throw new IntegrationConfigError('Escolha uma cidade antes de testar.');
    const weather = await fetchForecast(config.city, config.units);
    const { label } = describeWeather(weather.current.weatherCode, weather.current.isDay);
    return {
      ok: true,
      message: `Conectado: ${Math.round(weather.current.temperature)}° e ${label.toLowerCase()} em ${config.city.name}.`,
    };
  },
  async sync(ctx) {
    const weather = await ctx.refresh(weatherSource, undefined);
    return { message: `Previsão atualizada para ${weather.location.name}.` };
  },
});
