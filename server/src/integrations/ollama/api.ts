import type { OllamaModel } from '@polaris/shared';
import { ExternalServiceError, getJson, httpRequest } from '../http';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const base = (url: string) => url.replace(/\/+$/, '');

/** Modelos instalados no Ollama (GET /api/tags). */
export async function listModels(url: string): Promise<OllamaModel[]> {
  const data = await getJson<{
    models?: Array<{ name: string; size?: number; details?: { parameter_size?: string } }>;
  }>(`${base(url)}/api/tags`, { timeoutMs: 5000 });
  return (data.models ?? []).map((m) => ({
    name: m.name,
    sizeBytes: m.size ?? null,
    parameterSize: m.details?.parameter_size ?? null,
  }));
}

/** Conversa com o modelo (POST /api/chat, sem streaming). Modelos locais podem demorar. */
export async function chat(
  url: string,
  model: string,
  messages: ChatMessage[],
  options: { temperature?: number; json?: boolean; timeoutMs?: number } = {},
): Promise<string> {
  const response = await httpRequest(`${base(url)}/api/chat`, {
    method: 'POST',
    timeoutMs: options.timeoutMs ?? 180_000,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      ...(options.json ? { format: 'json' } : {}),
      options: { temperature: options.temperature ?? 0.6 },
    }),
  });
  const data = (await response.json()) as { message?: { content?: string }; error?: string };
  if (data.error) throw new ExternalServiceError(`O Ollama respondeu: ${data.error}`);
  const content = data.message?.content?.trim();
  if (!content) throw new ExternalServiceError('O modelo respondeu vazio.');
  return content;
}
