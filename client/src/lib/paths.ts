/**
 * Endereço da aba Integrações (fica dentro de Configurações).
 * Com um id, já abre a gaveta de configuração daquela integração.
 */
export function integrationsPath(integrationId?: string): string {
  const params = new URLSearchParams({ aba: 'integracoes' });
  if (integrationId) params.set('config', integrationId);
  return `/configuracoes?${params.toString()}`;
}

/** Endereço da aba Notas (fica dentro de Tarefas). */
export function notesPath(): string {
  return '/tarefas?aba=notas';
}
