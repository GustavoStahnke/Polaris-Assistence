import { readCache, writeCache } from '../repositories/cacheRepository';

export interface CachedResult<T> {
  data: T;
  fetchedAt: string;
  /** true quando o dado é antigo porque a atualização falhou. */
  stale: boolean;
  error: string | null;
  /** true quando o dado acabou de ser buscado (não veio do cache). */
  fresh: boolean;
  /** true quando houve uma tentativa agora e ela falhou. */
  failedNow: boolean;
}

/** Depois de uma falha, espera um pouco antes de tentar de novo (evita bombardear o serviço). */
const RETRY_AFTER_FAILURE_MS = 2 * 60_000;

/** Erro devolvido enquanto o serviço está "de castigo" depois de uma falha recente. */
export class BackoffError extends Error {}
const recentFailures = new Map<string, { at: number; message: string }>();

/**
 * Busca um dado com cache e validade:
 * - dentro da validade → devolve o cache;
 * - vencido → busca de novo;
 * - se a busca falhar e houver cache → devolve o cache antigo + o erro (nunca derruba a tela).
 */
export async function getOrFetch<T>(
  key: string,
  ttlMinutes: number,
  fetcher: () => Promise<T>,
  options: { force?: boolean; now?: Date } = {},
): Promise<CachedResult<T>> {
  const now = options.now ?? new Date();
  const cached = readCache<T>(key);
  const valid = cached && new Date(cached.expiresAt) > now;
  if (cached && valid && !options.force) {
    return {
      data: cached.value,
      fetchedAt: cached.fetchedAt,
      stale: false,
      error: null,
      fresh: false,
      failedNow: false,
    };
  }

  const failure = recentFailures.get(key);
  if (failure && !options.force && now.getTime() - failure.at < RETRY_AFTER_FAILURE_MS) {
    if (cached) {
      return {
        data: cached.value,
        fetchedAt: cached.fetchedAt,
        stale: true,
        error: failure.message,
        fresh: false,
        failedNow: false,
      };
    }
    throw new BackoffError(failure.message);
  }

  try {
    const data = await fetcher();
    const fetchedAt = now.toISOString();
    writeCache(key, data, fetchedAt, new Date(now.getTime() + ttlMinutes * 60_000).toISOString());
    recentFailures.delete(key);
    return { data, fetchedAt, stale: false, error: null, fresh: true, failedNow: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido.';
    recentFailures.set(key, { at: now.getTime(), message });
    if (cached) {
      return {
        data: cached.value,
        fetchedAt: cached.fetchedAt,
        stale: true,
        error: message,
        fresh: false,
        failedNow: true,
      };
    }
    throw error;
  }
}

/** Esquece as falhas recentes (ex.: depois de mudar a configuração). */
export function resetFailures(prefix = ''): void {
  for (const key of recentFailures.keys()) if (key.startsWith(prefix)) recentFailures.delete(key);
}
