import { healthResponseSchema, type HealthResponse } from '@polaris/shared';

/** Consulta a saúde do servidor e valida a resposta com o schema compartilhado. */
export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch('/api/health');
  if (!response.ok) throw new Error(`Servidor respondeu ${response.status}`);
  return healthResponseSchema.parse(await response.json());
}
