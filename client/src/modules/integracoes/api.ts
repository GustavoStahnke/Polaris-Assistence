import type {
  IntegrationActionResult,
  IntegrationLogView,
  IntegrationView,
  NewsFeed,
  NewsFeedInput,
  NewsFeedValidation,
} from '@polaris/shared';
import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '../../lib/api';
import { toast } from '../../stores/toastStore';

export const INTEGRATIONS_KEY = ['integrations'] as const;

export function useIntegrations() {
  return useQuery({
    queryKey: INTEGRATIONS_KEY,
    queryFn: () => api.get<IntegrationView[]>('/integrations'),
    refetchInterval: 60_000,
  });
}

export function useIntegrationLogs(id: string | null) {
  return useQuery({
    queryKey: ['integration-logs', id],
    queryFn: () => api.get<IntegrationLogView[]>(`/integrations/${id}/logs`),
    enabled: Boolean(id),
  });
}

/** Atualiza a lista depois de uma ação e mostra um aviso com o resultado. */
function useAfterAction() {
  const queryClient = useQueryClient();
  return (result: IntegrationActionResult | IntegrationView, title?: string) => {
    void queryClient.invalidateQueries({ queryKey: INTEGRATIONS_KEY });
    void queryClient.invalidateQueries({ queryKey: ['integration-logs'] });
    // Dados que dependem das integrações (clima, notícias...) também são recarregados.
    void queryClient.invalidateQueries({ queryKey: ['hub'] });
    if ('ok' in result && title) {
      if (result.ok) toast.success(title, result.message);
      else toast.error(title, result.message);
    }
  };
}

export function useUpdateIntegration() {
  const after = useAfterAction();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; enabled?: boolean; config?: Record<string, unknown> }) =>
      api.patch<IntegrationView>(`/integrations/${id}`, body),
    onSuccess: (view) => after(view),
    onError: (error) => toast.error('Não foi possível salvar', errorMessage(error)),
  });
}

type Action = 'test' | 'sync' | 'connect' | 'disconnect';
const ACTION_TITLES: Record<Action, string> = {
  test: 'Teste de conexão',
  sync: 'Sincronização',
  connect: 'Conexão',
  disconnect: 'Desconectar',
};

export function useIntegrationAction() {
  const after = useAfterAction();
  return useMutation({
    mutationKey: ['integration-action'],
    mutationFn: ({ id, action }: { id: string; action: Action }) =>
      api.post<IntegrationActionResult>(`/integrations/${id}/${action}`),
    onSuccess: (result, { action }) => {
      if (result.authUrl) {
        window.location.href = result.authUrl;
        return;
      }
      after(result, ACTION_TITLES[action]);
    },
    onError: (error, { action }) => toast.error(ACTION_TITLES[action], errorMessage(error)),
  });
}

export function useSyncAll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['integration-action'],
    mutationFn: () => api.post<{ ok: number; failed: number }>('/integrations/sync-all'),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: INTEGRATIONS_KEY });
      void queryClient.invalidateQueries({ queryKey: ['hub'] });
      if (result.failed)
        toast.warning('Sincronização concluída', `${result.ok} ok · ${result.failed} com erro`);
      else toast.success('Tudo sincronizado', `${result.ok} integrações atualizadas.`);
    },
    onError: (error) => toast.error('Falha ao sincronizar', errorMessage(error)),
  });
}

/** true enquanto alguma integração estiver sincronizando ou testando. */
export const useIsSyncing = () => useIsMutating({ mutationKey: ['integration-action'] }) > 0;

// ===== Feeds RSS =====

export function useFeeds() {
  return useQuery({ queryKey: ['feeds'], queryFn: () => api.get<NewsFeed[]>('/news/feeds') });
}

export function useFeedMutations() {
  const queryClient = useQueryClient();
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['feeds'] });
    void queryClient.invalidateQueries({ queryKey: ['hub'] });
  };
  return {
    validate: useMutation({
      mutationFn: (url: string) => api.post<NewsFeedValidation>('/news/feeds/validate', { url }),
    }),
    add: useMutation({
      mutationFn: (input: NewsFeedInput) => api.post<NewsFeed>('/news/feeds', input),
      onSuccess: (feed) => {
        refresh();
        toast.success('Feed adicionado', feed.title);
      },
      onError: (error) => toast.error('Não foi possível adicionar', errorMessage(error)),
    }),
    update: useMutation({
      mutationFn: ({ id, ...patch }: Partial<NewsFeedInput> & { id: string }) =>
        api.patch<NewsFeed>(`/news/feeds/${id}`, patch),
      onSuccess: refresh,
      onError: (error) => toast.error('Não foi possível salvar', errorMessage(error)),
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.delete(`/news/feeds/${id}`),
      onSuccess: () => {
        refresh();
        toast.info('Feed removido');
      },
      onError: (error) => toast.error('Não foi possível remover', errorMessage(error)),
    }),
  };
}
