import { healthResponseSchema, type HealthResponse } from '@polaris/shared';
import type { ZodType } from 'zod';

/** Erro vindo da API, com a mensagem amigável enviada pelo servidor. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

async function request<T>(method: Method, path: string, body?: unknown, schema?: ZodType<T>): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
    });
  } catch {
    throw new ApiError('Sem conexão com o servidor do Polaris.', 0, 'NETWORK');
  }

  const text = await response.text();
  const data: unknown = text ? JSON.parse(text) : undefined;

  if (!response.ok) {
    const error = (data as { error?: { message?: string; code?: string } } | undefined)?.error;
    const apiError = new ApiError(
      error?.message ?? `Erro ${response.status}`,
      response.status,
      error?.code ?? 'UNKNOWN',
    );
    window.dispatchEvent(new CustomEvent('polaris:api-error', { detail: apiError }));
    throw apiError;
  }

  return schema ? schema.parse(data) : (data as T);
}

export const api = {
  get: <T>(path: string, schema?: ZodType<T>) => request<T>('GET', path, undefined, schema),
  post: <T>(path: string, body?: unknown, schema?: ZodType<T>) =>
    request<T>('POST', path, body ?? {}, schema),
  patch: <T>(path: string, body: unknown, schema?: ZodType<T>) => request<T>('PATCH', path, body, schema),
  put: <T>(path: string, body: unknown, schema?: ZodType<T>) => request<T>('PUT', path, body, schema),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
};

/** Mensagem legível de qualquer erro. */
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Algo deu errado. Tente de novo.';

export const fetchHealth = (): Promise<HealthResponse> => api.get('/health', healthResponseSchema);
