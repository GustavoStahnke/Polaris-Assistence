import type { EmailCategory, EmailResponse } from '@polaris/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '../../lib/api';
import { toast } from '../../stores/toastStore';

const KEY = ['hub', 'email'] as const;

export const useEmails = () =>
  useQuery({ queryKey: KEY, queryFn: () => api.get<EmailResponse>('/email'), refetchInterval: 5 * 60_000 });

export function useEmailActions() {
  const queryClient = useQueryClient();
  return {
    refresh: useMutation({
      mutationFn: () => api.post<EmailResponse>('/email/refresh'),
      onSuccess: (data) => queryClient.setQueryData(KEY, data),
      onError: (error) => toast.error('Não foi possível atualizar', errorMessage(error)),
    }),
    triage: useMutation({
      mutationFn: ({ id, category }: { id: string; category: EmailCategory }) =>
        api.patch(`/email/${id}/triage`, { category }),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: KEY });
        void queryClient.invalidateQueries({ queryKey: ['alerts'] });
      },
      onError: (error) => toast.error('Não foi possível salvar', errorMessage(error)),
    }),
  };
}
