import type { IntegrationAuthType, IntegrationCategory, IntegrationGuide, LogLevel } from '@polaris/shared';
import type { ZodType } from 'zod';

/** Tudo o que uma integração recebe para trabalhar. */
export interface IntegrationContext<Config> {
  id: string;
  config: Config;
  /** Tokens salvos (criptografados no banco), ex.: OAuth do Google. */
  tokens: Record<string, unknown> | null;
  saveTokens(tokens: Record<string, unknown> | null): void;
  log(level: LogLevel, message: string, details?: unknown): void;
  /** Contexto de uma integração da qual esta depende (ex.: gmail → google-account). */
  dependency<T = unknown>(id: string): IntegrationContext<T>;
  /** Busca um dado de novo, ignorando a validade do cache (usado na sincronização). */
  refresh<T, Params = void>(source: DataSource<Config, T, Params>, params: Params): Promise<T>;
}

/**
 * Uma "fonte de dados" de uma integração: como buscar, a chave do cache e a validade.
 * Os módulos pedem esses dados ao hub (integrationService), nunca chamam a API direto.
 */
export interface DataSource<Config, T, Params = void> {
  key(config: Config, params: Params): string;
  ttlMinutes: number;
  fetch(ctx: IntegrationContext<Config>, params: Params): Promise<T>;
}

export interface TestResult {
  ok: boolean;
  message: string;
}

export interface ConnectResult {
  /** OAuth: URL de autorização para abrir no navegador. */
  authUrl?: string;
  message: string;
}

export interface SyncResult {
  message: string;
  items?: number;
}

/**
 * Contrato de cada integração (CLAUDE.md, seção 7).
 * Os métodos usam a sintaxe de método para que o registro aceite configurações de tipos diferentes.
 */
export interface IntegrationDefinition<Config = unknown> {
  id: string;
  name: string;
  category: IntegrationCategory;
  description: string;
  icon: string;
  authType: IntegrationAuthType;
  availability: 'available' | 'soon';
  free: boolean;
  configSchema: ZodType<Config>;
  dependsOn?: string[];
  syncIntervalMinutes?: number;
  /** Já começa ativada (integrações que não precisam de configuração). */
  defaultEnabled?: boolean;
  /** Painéis extras na gaveta de configuração (ex.: 'feed-list'). */
  panels?: string[];
  /** Guia passo a passo exibido na interface. */
  guide?: IntegrationGuide;
  /** Diz se a configuração mínima foi feita. Padrão: sempre configurada. */
  isConfigured?(config: Config, tokens: Record<string, unknown> | null): boolean;
  /** Conta conectada a exibir (ex.: e-mail do Google). */
  getAccount?(tokens: Record<string, unknown> | null): string | null;
  test(ctx: IntegrationContext<Config>): Promise<TestResult>;
  connect?(ctx: IntegrationContext<Config>): Promise<ConnectResult>;
  disconnect?(ctx: IntegrationContext<Config>): Promise<void>;
  sync?(ctx: IntegrationContext<Config>): Promise<SyncResult>;
}

/** Ajuda a escrever definições com o tipo de configuração correto. */
export function defineIntegration<Config>(
  definition: IntegrationDefinition<Config>,
): IntegrationDefinition<Config> {
  return definition;
}

/** Erro de autenticação expirada: a integração passa para "RECONECTAR". */
export class IntegrationAuthError extends Error {}

/** Erro de configuração incompleta. */
export class IntegrationConfigError extends Error {}
