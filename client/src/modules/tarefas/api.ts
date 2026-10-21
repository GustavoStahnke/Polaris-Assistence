import type { Reminder, ReminderInput, Task, TaskInput, TodayAgenda } from '@polaris/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '../../lib/api';
import { toast } from '../../stores/toastStore';

export const useTasks = () => useQuery({ queryKey: ['tasks'], queryFn: () => api.get<Task[]>('/tasks') });
export const useReminders = () =>
  useQuery({ queryKey: ['reminders'], queryFn: () => api.get<Reminder[]>('/reminders') });
export const useTodayAgenda = () =>
  useQuery({
    queryKey: ['tasks', 'today'],
    queryFn: () => api.get<TodayAgenda>('/tasks/today'),
    refetchInterval: 5 * 60_000,
  });

function useRefresh() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    void queryClient.invalidateQueries({ queryKey: ['reminders'] });
    void queryClient.invalidateQueries({ queryKey: ['alerts'] });
  };
}

export function useTaskMutations() {
  const refresh = useRefresh();
  const onError = (error: unknown) => toast.error('Não deu certo', errorMessage(error));
  return {
    create: useMutation({
      mutationFn: (input: Partial<TaskInput> & { title: string }) => api.post<Task>('/tasks', input),
      onSuccess: () => {
        refresh();
        toast.success('Tarefa criada');
      },
      onError,
    }),
    update: useMutation({
      mutationFn: ({ id, ...patch }: Partial<TaskInput> & { id: string }) =>
        api.patch<Task>(`/tasks/${id}`, patch),
      onSuccess: refresh,
      onError,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.delete(`/tasks/${id}`),
      onSuccess: refresh,
      onError,
    }),
  };
}

export function useReminderMutations() {
  const refresh = useRefresh();
  const onError = (error: unknown) => toast.error('Não deu certo', errorMessage(error));
  return {
    create: useMutation({
      mutationFn: (input: ReminderInput) => api.post<Reminder>('/reminders', input),
      onSuccess: () => {
        refresh();
        toast.success('Lembrete criado');
      },
      onError,
    }),
    update: useMutation({
      mutationFn: ({ id, ...patch }: Partial<ReminderInput> & { id: string; done?: boolean }) =>
        api.patch<Reminder>(`/reminders/${id}`, patch),
      onSuccess: refresh,
      onError,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.delete(`/reminders/${id}`),
      onSuccess: refresh,
      onError,
    }),
  };
}
