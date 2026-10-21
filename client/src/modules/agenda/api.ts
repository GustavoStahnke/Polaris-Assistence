import type { AgendaResponse } from '@polaris/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';

export const useAgenda = (range: 'hoje' | 'semana') =>
  useQuery({
    queryKey: ['hub', 'agenda', range],
    queryFn: () => api.get<AgendaResponse>(`/agenda?range=${range}`),
    refetchInterval: 5 * 60_000,
  });

export function useRefreshAgenda(range: 'hoje' | 'semana') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<AgendaResponse>(`/agenda/refresh?range=${range}`),
    onSuccess: (data) => queryClient.setQueryData(['hub', 'agenda', range], data),
  });
}
