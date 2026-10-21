import { APP_NAME, APP_VERSION } from '@polaris/shared';

// Cliente HTTP usado pelas integrações: tempo limite, identificação e mensagens amigáveis.

export const USER_AGENT = `${APP_NAME.replace(/\s/g, '')}/${APP_VERSION} (app pessoal local)`;

/** Erro de serviço externo, com mensagem pronta para mostrar ao usuário. */
export class ExternalServiceError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

export async function httpRequest(
  url: string,
  { timeoutMs = 12_000, headers, ...init }: RequestOptions = {},
) {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { 'User-Agent': USER_AGENT, ...headers },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const name = (error as Error).name;
    const cause = (error as { cause?: { code?: string } }).cause?.code;
    if (name === 'TimeoutError' || name === 'AbortError') {
      throw new ExternalServiceError('O serviço demorou demais para responder.');
    }
    if (cause === 'ENOTFOUND' || cause === 'EAI_AGAIN') {
      throw new ExternalServiceError('Sem internet ou endereço não encontrado.');
    }
    if (cause === 'ECONNREFUSED') {
      throw new ExternalServiceError('Conexão recusada: o serviço não está rodando nesse endereço.');
    }
    throw new ExternalServiceError(`Falha de conexão (${cause ?? name}).`);
  }
  if (!response.ok) {
    throw new ExternalServiceError(`O serviço respondeu com erro ${response.status}.`, response.status);
  }
  return response;
}

export async function getJson<T>(url: string, options?: RequestOptions): Promise<T> {
  const response = await httpRequest(url, {
    ...options,
    headers: { Accept: 'application/json', ...options?.headers },
  });
  try {
    return (await response.json()) as T;
  } catch {
    throw new ExternalServiceError('O serviço respondeu num formato inesperado.');
  }
}

/** Baixa um texto respeitando a codificação (alguns feeds ainda usam ISO-8859-1). */
export async function getText(url: string, options?: RequestOptions): Promise<string> {
  const response = await httpRequest(url, options);
  const buffer = await response.arrayBuffer();
  const headerCharset = /charset=([\w-]+)/i.exec(response.headers.get('content-type') ?? '')?.[1];
  const head = new TextDecoder('ascii').decode(buffer.slice(0, 200));
  const xmlCharset = /encoding=["']([\w-]+)["']/i.exec(head)?.[1];
  const charset = (xmlCharset ?? headerCharset ?? 'utf-8').toLowerCase();
  try {
    return new TextDecoder(charset).decode(buffer);
  } catch {
    return new TextDecoder('utf-8').decode(buffer);
  }
}

/** Mensagem legível de qualquer erro. */
export const describeError = (error: unknown) =>
  error instanceof Error ? error.message : 'Erro desconhecido.';
