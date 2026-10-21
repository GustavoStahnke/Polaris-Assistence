// Tipos do Hub de Integrações compartilhados entre servidor e interface.

export type IntegrationCategory =
  | 'clima'
  | 'noticias'
  | 'livros'
  | 'google'
  | 'ia'
  | 'produtividade'
  | 'saude'
  | 'musica'
  | 'nuvem'
  | 'financas';

export type IntegrationStatus =
  'nao_configurada' | 'conectada' | 'erro' | 'expirada' | 'desativada' | 'em_breve';

export type IntegrationAuthType = 'none' | 'apiKey' | 'oauth2' | 'local';

export const INTEGRATION_CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  clima: 'Clima',
  noticias: 'Notícias',
  livros: 'Livros',
  google: 'Google',
  ia: 'Inteligência artificial',
  produtividade: 'Produtividade',
  saude: 'Saúde',
  musica: 'Música',
  nuvem: 'Nuvem',
  financas: 'Finanças',
};

export interface IntegrationGuide {
  title: string;
  steps: string[];
  notes?: string[];
}

/** Integração como a interface enxerga (configuração já sem segredos). */
export interface IntegrationView {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  icon: string;
  authType: IntegrationAuthType;
  availability: 'available' | 'soon';
  free: boolean;
  dependsOn: string[];
  syncIntervalMinutes: number | null;
  canSync: boolean;
  canConnect: boolean;
  enabled: boolean;
  configured: boolean;
  status: IntegrationStatus;
  lastSyncAt: string | null;
  lastTestAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
  /** Conta conectada (ex.: e-mail do Google). */
  account: string | null;
  config: Record<string, unknown>;
  /** JSON Schema do formulário de configuração (gerado do schema zod). */
  configSchema: Record<string, unknown> | null;
  /** Painéis extras na gaveta (ex.: 'feed-list'). */
  panels: string[];
  guide: IntegrationGuide | null;
}

export interface IntegrationLogView {
  id: string;
  integrationId: string;
  level: 'info' | 'success' | 'warning' | 'error';
  action: string;
  message: string;
  createdAt: string;
}

export interface IntegrationActionResult {
  ok: boolean;
  message: string;
  /** No OAuth: URL para onde o navegador deve ir. */
  authUrl?: string;
  integration: IntegrationView;
}

/** Resultado de um dado vindo do hub: nunca lança erro, sempre diz o estado. */
export interface HubResult<T> {
  integrationId: string;
  state: 'ok' | 'stale' | 'error' | 'not_configured' | 'disabled';
  data: T | null;
  fetchedAt: string | null;
  error: string | null;
}

/** Valor que substitui segredos ao mostrar a configuração. */
export const SECRET_MASK = '••••••••';
