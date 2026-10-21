import type {
  Book,
  BookDetail,
  BookInput,
  BookNote,
  BookNoteInput,
  BookRecommendation,
  BookSearchResult,
  BookUpdate,
  HubResult,
  ReadingGoal,
  ReadingLog,
  ReadingStats,
  RememberItem,
} from '@polaris/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '../../lib/api';
import { toast } from '../../stores/toastStore';

const LIB = ['library'] as const;

export const useBooks = () =>
  useQuery({ queryKey: [...LIB, 'books'], queryFn: () => api.get<Book[]>('/library/books') });
export const useBook = (id: string | undefined) =>
  useQuery({
    queryKey: [...LIB, 'book', id],
    queryFn: () => api.get<BookDetail>(`/library/books/${id}`),
    enabled: Boolean(id),
  });
export const useCurrentReading = () =>
  useQuery({ queryKey: [...LIB, 'current'], queryFn: () => api.get<Book[]>('/library/current') });
export const useRemember = () =>
  useQuery({ queryKey: [...LIB, 'remember'], queryFn: () => api.get<RememberItem[]>('/library/remember') });
export const useGoal = (year: number) =>
  useQuery({
    queryKey: [...LIB, 'goal', year],
    queryFn: () => api.get<ReadingGoal>(`/library/goal?year=${year}`),
  });
export const useStats = (year: number) =>
  useQuery({
    queryKey: [...LIB, 'stats', year],
    queryFn: () => api.get<ReadingStats>(`/library/stats?year=${year}`),
  });
export const useRecommendations = () =>
  useQuery({
    queryKey: [...LIB, 'recommendations'],
    queryFn: () => api.get<BookRecommendation[]>('/library/recommendations'),
  });

export const useBookSearch = (query: string) =>
  useQuery({
    queryKey: ['hub', 'book-search', query],
    queryFn: () => api.get<HubResult<BookSearchResult[]>>(`/library/search?q=${encodeURIComponent(query)}`),
    enabled: query.trim().length >= 2,
    staleTime: 5 * 60_000,
  });

function useLibraryMutation<TVars, TResult>(
  fn: (vars: TVars) => Promise<TResult>,
  success?: (result: TResult) => string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: LIB });
      void queryClient.invalidateQueries({ queryKey: ['habits'] });
      void queryClient.invalidateQueries({ queryKey: ['briefing'] });
      if (success) toast.success(success(result));
    },
    onError: (error) => toast.error('Não deu certo', errorMessage(error)),
  });
}

export const useCreateBook = () =>
  useLibraryMutation(
    (input: BookInput) => api.post<Book>('/library/books', input),
    (b) => `"${b.title}" na estante`,
  );
export const useUpdateBook = () =>
  useLibraryMutation(({ id, ...patch }: BookUpdate & { id: string }) =>
    api.patch<Book>(`/library/books/${id}`, patch),
  );
export const useDeleteBook = () =>
  useLibraryMutation(
    (id: string) => api.delete(`/library/books/${id}`),
    () => 'Livro removido',
  );
export const useLogReading = () =>
  useLibraryMutation(
    ({ id, ...log }: ReadingLog & { id: string }) =>
      api.post<BookDetail>(`/library/books/${id}/reading`, log),
    (d) =>
      `Leitura registrada: página ${d.book.currentPage}${d.book.status === 'lido' ? ' · livro concluído! 🎉' : ''}`,
  );
export const useDeleteReading = () =>
  useLibraryMutation((id: string) => api.delete(`/library/reading/${id}`));
export const useCreateNote = () =>
  useLibraryMutation(
    ({ bookId, ...input }: BookNoteInput & { bookId: string }) =>
      api.post<BookNote>(`/library/books/${bookId}/notes`, input),
    () => 'Anotação salva',
  );
export const useUpdateNote = () =>
  useLibraryMutation(({ id, ...patch }: Partial<BookNoteInput> & { id: string }) =>
    api.patch<BookNote>(`/library/notes/${id}`, patch),
  );
export const useDeleteNote = () => useLibraryMutation((id: string) => api.delete(`/library/notes/${id}`));
export const useSetGoal = () =>
  useLibraryMutation(
    (input: { year: number; targetBooks: number }) => api.put<ReadingGoal>('/library/goal', input),
    () => 'Meta salva',
  );
export const useRefreshRecommendations = () =>
  useLibraryMutation(
    () => api.post<{ items: BookRecommendation[]; message: string }>('/library/recommendations/refresh'),
    (r) => r.message,
  );
export const useAddRecommendation = () =>
  useLibraryMutation(
    (id: string) => api.post<Book>(`/library/recommendations/${id}/add`),
    (b) => `"${b.title}" na estante`,
  );
export const useDismissRecommendation = () =>
  useLibraryMutation((id: string) => api.delete(`/library/recommendations/${id}`));
