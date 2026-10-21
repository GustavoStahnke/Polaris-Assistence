import type { WeatherResponse } from '@polaris/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export const WEATHER_KEY = ['hub', 'weather'] as const;

export const useWeather = () =>
  useQuery({
    queryKey: WEATHER_KEY,
    queryFn: () => api.get<WeatherResponse>('/weather'),
    refetchInterval: 10 * 60_000,
  });

export function useRefreshWeather() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<WeatherResponse>('/weather/refresh'),
    onSuccess: (data) => {
      queryClient.setQueryData(WEATHER_KEY, data);
      void queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
