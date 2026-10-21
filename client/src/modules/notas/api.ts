import type { Note, NoteInput } from '@polaris/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '../../lib/api';
import { toast } from '../../stores/toastStore';

export const useNotes = (query: string) =>
  useQuery({
    queryKey: ['notes', query],
    queryFn: () => api.get<Note[]>(`/notes${query ? `?q=${encodeURIComponent(query)}` : ''}`),
    placeholderData: (previous) => previous,
  });

export function useNoteMutations() {
  const queryClient = useQueryClient();
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['notes'] });
  const onError = (error: unknown) => toast.error('Não deu certo', errorMessage(error));
  return {
    create: useMutation({
      mutationFn: (input: Partial<NoteInput>) => api.post<Note>('/notes', input),
      onSuccess: () => {
        refresh();
        toast.success('Nota salva', 'Capturada no seu segundo cérebro.');
      },
      onError,
    }),
    update: useMutation({
      mutationFn: ({ id, ...patch }: Partial<NoteInput> & { id: string }) =>
        api.patch<Note>(`/notes/${id}`, patch),
      onSuccess: refresh,
      onError,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.delete(`/notes/${id}`),
      onSuccess: () => {
        refresh();
        toast.info('Nota apagada');
      },
      onError,
    }),
  };
}
