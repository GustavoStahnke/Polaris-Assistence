import type { NewsItemView, NewsResponse, SavedArticle } from '@polaris/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '../../lib/api';
import { toast } from '../../stores/toastStore';

const NEWS = ['hub', 'news'] as const;

export const useNews = (filter: { category?: string; q?: string; unread?: boolean } = {}) => {
  const params = new URLSearchParams();
  if (filter.category) params.set('category', filter.category);
  if (filter.q) params.set('q', filter.q);
  if (filter.unread) params.set('unread', '1');
  return useQuery({
    queryKey: [...NEWS, filter],
    queryFn: () => api.get<NewsResponse>(`/news?${params.toString()}`),
    placeholderData: (previous) => previous,
  });
};

export const useSavedNews = () =>
  useQuery({ queryKey: ['news-saved'], queryFn: () => api.get<SavedArticle[]>('/news/saved') });

export function useNewsActions() {
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: NEWS });
    void queryClient.invalidateQueries({ queryKey: ['news-saved'] });
  };
  const onError = (error: unknown) => toast.error('Não deu certo', errorMessage(error));
  return {
    markRead: useMutation({
      mutationFn: ({ link, read }: { link: string; read: boolean }) => api.post('/news/read', { link, read }),
      onSuccess: refresh,
      onError,
    }),
    save: useMutation({
      mutationFn: (item: NewsItemView) =>
        api.post<SavedArticle>('/news/saved', {
          link: item.link,
          title: item.title,
          source: item.source,
          category: item.category,
          imageUrl: item.imageUrl,
          summary: item.summary,
          publishedAt: item.publishedAt,
        }),
      onSuccess: () => {
        refresh();
        toast.success('Salva para ler depois');
      },
      onError,
    }),
    unsave: useMutation({
      mutationFn: (id: string) => api.delete(`/news/saved/${id}`),
      onSuccess: refresh,
      onError,
    }),
    reload: useMutation({
      mutationFn: () => api.post<NewsResponse>('/news/refresh'),
      onSuccess: () => {
        refresh();
        toast.success('Notícias atualizadas');
      },
      onError,
    }),
  };
}
