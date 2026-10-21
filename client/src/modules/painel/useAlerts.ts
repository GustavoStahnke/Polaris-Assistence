import type { DashboardAlert } from '@polaris/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

/** Alertas do Painel (clima, agenda, e-mails). */
export const useAlerts = () =>
  useQuery({
    queryKey: ['alerts'],
    queryFn: () => api.get<DashboardAlert[]>('/alerts'),
    refetchInterval: 60_000,
  });
