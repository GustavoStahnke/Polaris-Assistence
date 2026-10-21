import type { Habit, HabitHeatmap, HabitInput } from '@polaris/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '../../lib/api';
import { toast } from '../../stores/toastStore';

export const useHabits = () => useQuery({ queryKey: ['habits'], queryFn: () => api.get<Habit[]>('/habits') });
export const useHeatmap = (year: number, habitId: string | null) =>
  useQuery({
    queryKey: ['habits', 'heatmap', year, habitId],
    queryFn: () =>
      api.get<HabitHeatmap>(`/habits/heatmap?year=${year}${habitId ? `&habitId=${habitId}` : ''}`),
  });

export function useHabitMutations() {
  const queryClient = useQueryClient();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['habits'] });
  const onError = (error: unknown) => toast.error('Não deu certo', errorMessage(error));
  return {
    toggle: useMutation({
      mutationFn: ({ id, date, done }: { id: string; date?: string; done?: boolean }) =>
        api.post<Habit>(`/habits/${id}/toggle`, { date, done }),
      onMutate: async ({ id }) => {
        // Resposta instantânea na tela; o servidor confirma em seguida.
        await queryClient.cancelQueries({ queryKey: ['habits'] });
        const previous = queryClient.getQueryData<Habit[]>(['habits']);
        queryClient.setQueryData<Habit[]>(['habits'], (old) =>
          old?.map((h) => (h.id === id ? { ...h, doneToday: !h.doneToday } : h)),
        );
        return { previous };
      },
      onError: (error, _vars, context) => {
        queryClient.setQueryData(['habits'], context?.previous);
        onError(error);
      },
      onSettled: refresh,
    }),
    create: useMutation({
      mutationFn: (input: HabitInput) => api.post<Habit>('/habits', input),
      onSuccess: () => {
        refresh();
        toast.success('Hábito criado');
      },
      onError,
    }),
    update: useMutation({
      mutationFn: ({ id, ...input }: Partial<HabitInput> & { id: string }) =>
        api.patch<Habit>(`/habits/${id}`, input),
      onSuccess: refresh,
      onError,
    }),
    archive: useMutation({
      mutationFn: (id: string) => api.post(`/habits/${id}/archive`),
      onSuccess: refresh,
      onError,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.delete(`/habits/${id}`),
      onSuccess: refresh,
      onError,
    }),
  };
}
