import type {
  AiBriefing,
  AiConversation,
  AiStatus,
  BookIdeaSummary,
  Briefing,
  ChatResponse,
} from '@polaris/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '../../lib/api';
import { toast } from '../../stores/toastStore';
import { useUiStore } from '../../stores/uiStore';

export const useAiStatus = () =>
  useQuery({
    queryKey: ['ai', 'status'],
    queryFn: () => api.get<AiStatus>('/ai/status'),
    refetchInterval: 60_000,
  });

export const useConversations = () =>
  useQuery({
    queryKey: ['ai', 'conversations'],
    queryFn: () => api.get<AiConversation[]>('/ai/conversations'),
  });

export const useConversation = (id: string | null) =>
  useQuery({
    queryKey: ['ai', 'conversation', id],
    queryFn: () => api.get<AiConversation>(`/ai/conversations/${id}`),
    enabled: Boolean(id),
  });

export const useBriefing = () =>
  useQuery({
    queryKey: ['briefing'],
    queryFn: () => api.get<Briefing>('/briefing'),
    refetchInterval: 5 * 60_000,
  });

export const useAiBriefing = (enabled: boolean) =>
  useQuery({
    queryKey: ['briefing', 'ai'],
    queryFn: () => api.get<AiBriefing>('/briefing/ai'),
    enabled,
    staleTime: 30 * 60_000,
    retry: 0,
  });

/** Envia uma mensagem à Polaris. O Núcleo fica "processando" enquanto ela pensa. */
export function useSendMessage() {
  const queryClient = useQueryClient();
  const setNucleus = useUiStore((s) => s.setNucleusState);
  return useMutation({
    mutationFn: (input: { conversationId: string | null; message: string }) =>
      api.post<ChatResponse>('/ai/chat', input),
    onMutate: () => setNucleus('processando'),
    onSettled: () => setNucleus('ocioso'),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['ai', 'conversations'] });
      void queryClient.invalidateQueries({ queryKey: ['ai', 'conversation', data.conversationId] });
    },
    onError: (error) => toast.error('A Polaris não respondeu', errorMessage(error)),
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/ai/conversations/${id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['ai', 'conversations'] }),
  });
}

export function useBookSummary(bookId: string) {
  const queryClient = useQueryClient();
  const setNucleus = useUiStore((s) => s.setNucleusState);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['library', 'book', bookId] });
  return {
    generate: useMutation({
      mutationFn: () => api.post<BookIdeaSummary>(`/ai/books/${bookId}/summary`),
      onMutate: () => setNucleus('processando'),
      onSettled: () => setNucleus('ocioso'),
      onSuccess: () => {
        refresh();
        toast.success('Resumo das suas ideias pronto');
      },
      onError: (error) => toast.error('Não foi possível gerar', errorMessage(error)),
    }),
    save: useMutation({
      mutationFn: (content: string) => api.put<BookIdeaSummary>(`/ai/books/${bookId}/summary`, { content }),
      onSuccess: () => {
        refresh();
        toast.success('Resumo salvo');
      },
      onError: (error) => toast.error('Não foi possível salvar', errorMessage(error)),
    }),
  };
}
