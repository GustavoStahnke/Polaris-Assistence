import {
  SECRET_MASK,
  type CityLocation,
  type NewsFeedValidation,
  type HubResult,
  type IntegrationActionResult,
  type IntegrationLogView,
  type IntegrationStatus,
  type IntegrationView,
} from '@polaris/shared';
import { z } from 'zod';
import { describeError } from '../integrations/http';
import { bookSearchSource, subjectSource } from '../integrations/open-library';
import { searchCities as searchCityApi } from '../integrations/open-meteo/api';
import { weatherSource } from '../integrations/open-meteo';
import { findIntegration, INTEGRATIONS } from '../integrations/registry';
import { newsSource } from '../integrations/rss';
import { validateFeed } from '../integrations/rss/api';
import {
  IntegrationAuthError,
  IntegrationConfigError,
  type DataSource,
  type IntegrationContext,
  type IntegrationDefinition,
} from '../integrations/types';
import { badRequest, notFound } from '../lib/http';
import {
  addIntegrationLog,
  getIntegrationState,
  listIntegrationLogs,
  pruneIntegrationLogs,
  saveIntegrationState,
  type IntegrationState,
} from '../repositories/integrationsRepository';
import { decryptJson, encryptJson } from '../security/crypto';
import { BackoffError, getOrFetch, resetFailures } from './cacheService';

// Hub de Integrações: é por aqui que os módulos pedem dados externos.
// Cuida de configuração (criptografada), status, cache, logs e erros.

type Definition = IntegrationDefinition<unknown>;
type Tokens = Record<string, unknown> | null;

const nowIso = () => new Date().toISOString();

function requireDefinition(id: string): Definition {
  const definition = findIntegration(id);
  if (!definition) throw notFound('Integração não encontrada.');
  return definition;
}

/** Estado salvo, ou o estado padrão de quem nunca foi configurado. */
function stateOf(definition: Definition): IntegrationState {
  return (
    getIntegrationState(definition.id) ?? {
      id: '',
      integrationId: definition.id,
      enabled: definition.defaultEnabled ?? false,
      configEncrypted: null,
      tokensEncrypted: null,
      lastSyncAt: null,
      lastTestAt: null,
      lastSuccessAt: null,
      lastError: null,
      lastErrorAt: null,
      needsReconnect: false,
      createdAt: '',
      updatedAt: '',
    }
  );
}

/** Configuração descriptografada e validada (com os valores padrão do schema). */
function readConfig(definition: Definition, state: IntegrationState): unknown {
  const raw = decryptJson<Record<string, unknown>>(state.configEncrypted) ?? {};
  const parsed = definition.configSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  const fallback = definition.configSchema.safeParse({});
  return fallback.success ? fallback.data : raw;
}

const readTokens = (state: IntegrationState): Tokens =>
  decryptJson<Record<string, unknown>>(state.tokensEncrypted);

const jsonSchemaCache = new Map<string, Record<string, unknown> | null>();

/** JSON Schema do formulário de configuração (gerado a partir do schema zod). */
function configJsonSchema(definition: Definition): Record<string, unknown> | null {
  if (!jsonSchemaCache.has(definition.id)) {
    const schema = z.toJSONSchema(definition.configSchema, { io: 'input', unrepresentable: 'any' }) as Record<
      string,
      unknown
    >;
    const properties = (schema.properties ?? {}) as Record<string, unknown>;
    jsonSchemaCache.set(definition.id, Object.keys(properties).length ? schema : null);
  }
  return jsonSchemaCache.get(definition.id) ?? null;
}

/** Campos marcados como segredo (ex.: Client Secret), que nunca voltam para a interface. */
function secretKeys(definition: Definition): string[] {
  const properties = (configJsonSchema(definition)?.properties ?? {}) as Record<string, { secret?: boolean }>;
  return Object.entries(properties)
    .filter(([, property]) => property.secret)
    .map(([key]) => key);
}

function isConfigured(definition: Definition, config: unknown, tokens: Tokens): boolean {
  return definition.isConfigured ? definition.isConfigured(config, tokens) : true;
}

export function computeStatus(
  definition: Definition,
  state: IntegrationState,
  configured: boolean,
): IntegrationStatus {
  if (definition.availability === 'soon') return 'em_breve';
  if (!configured) return 'nao_configurada';
  if (!state.enabled) return 'desativada';
  if (state.needsReconnect) return 'expirada';
  const errorIsNewest =
    state.lastError && (!state.lastSuccessAt || (state.lastErrorAt ?? '') >= state.lastSuccessAt);
  return errorIsNewest ? 'erro' : 'conectada';
}

function toView(definition: Definition): IntegrationView {
  const state = stateOf(definition);
  const config = readConfig(definition, state);
  const tokens = readTokens(state);
  const configured = isConfigured(definition, config, tokens);
  const masked: Record<string, unknown> = { ...(config as Record<string, unknown>) };
  for (const key of secretKeys(definition)) if (masked[key]) masked[key] = SECRET_MASK;

  return {
    id: definition.id,
    name: definition.name,
    category: definition.category,
    description: definition.description,
    icon: definition.icon,
    authType: definition.authType,
    availability: definition.availability,
    free: definition.free,
    dependsOn: definition.dependsOn ?? [],
    syncIntervalMinutes: definition.syncIntervalMinutes ?? null,
    canSync: Boolean(definition.sync),
    canConnect: Boolean(definition.connect),
    enabled: definition.availability === 'available' && state.enabled,
    configured,
    status: computeStatus(definition, state, configured),
    lastSyncAt: state.lastSyncAt,
    lastTestAt: state.lastTestAt,
    lastSuccessAt: state.lastSuccessAt,
    lastError: state.lastError,
    lastErrorAt: state.lastErrorAt,
    account: definition.getAccount?.(tokens) ?? null,
    config: masked,
    configSchema: configJsonSchema(definition),
    panels: definition.panels ?? [],
    guide: definition.guide ?? null,
  };
}

/** Grava o estado. Na primeira gravação, respeita se a integração começa ativada. */
function saveState(id: string, patch: Partial<IntegrationState>) {
  const exists = getIntegrationState(id);
  const initial = exists ? {} : { enabled: findIntegration(id)?.defaultEnabled ?? false };
  return saveIntegrationState(id, { ...initial, ...patch });
}

function log(id: string, level: 'info' | 'success' | 'warning' | 'error', action: string, message: string) {
  addIntegrationLog(id, level, action, message);
  pruneIntegrationLogs(id);
}

function recordSuccess(id: string, action: string, message: string, extra: Partial<IntegrationState> = {}) {
  saveState(id, {
    lastSuccessAt: nowIso(),
    lastError: null,
    lastErrorAt: null,
    needsReconnect: false,
    ...extra,
  });
  log(id, 'success', action, message);
}

function recordFailure(id: string, action: string, error: unknown, extra: Partial<IntegrationState> = {}) {
  const message = describeError(error);
  saveState(id, {
    lastError: message,
    lastErrorAt: nowIso(),
    ...(error instanceof IntegrationAuthError ? { needsReconnect: true } : {}),
    ...extra,
  });
  log(id, 'error', action, message);
  return message;
}

/** Monta o contexto entregue à integração (configuração, tokens, logs, dependências). */
function buildContext(definition: Definition): IntegrationContext<unknown> {
  const state = stateOf(definition);
  const config = readConfig(definition, state);
  const context: IntegrationContext<unknown> = {
    id: definition.id,
    config,
    tokens: readTokens(state),
    saveTokens(tokens) {
      saveState(definition.id, { tokensEncrypted: tokens ? encryptJson(tokens) : null });
      context.tokens = tokens;
    },
    log(level, message) {
      log(definition.id, level, 'info', message);
    },
    dependency<T>(id: string) {
      return buildContext(requireDefinition(id)) as IntegrationContext<T>;
    },
    async refresh<T, Params>(source: DataSource<unknown, T, Params>, params: Params) {
      const result = await getOrFetch(
        source.key(config, params),
        source.ttlMinutes,
        () => source.fetch(context, params),
        { force: true },
      );
      if (result.error) throw new Error(result.error);
      return result.data;
    },
  };
  return context;
}

const assertAvailable = (definition: Definition) => {
  if (definition.availability !== 'available') throw badRequest('Esta integração ainda não está disponível.');
};

// ===== API pública do hub =====

export function listIntegrations(): IntegrationView[] {
  return INTEGRATIONS.map(toView);
}

export function getIntegrationView(id: string): IntegrationView {
  return toView(requireDefinition(id));
}

export function listLogs(id: string): IntegrationLogView[] {
  requireDefinition(id);
  return listIntegrationLogs(id).map((row) => ({
    id: row.id,
    integrationId: row.integrationId,
    level: row.level,
    action: row.action,
    message: row.message,
    createdAt: row.createdAt,
  }));
}

const updateSchema = z.object({
  enabled: z.boolean().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

/** Salva a configuração (criptografada) e/ou ativa e desativa. */
export function updateIntegration(id: string, input: unknown): IntegrationView {
  const definition = requireDefinition(id);
  assertAvailable(definition);
  const parsedInput = updateSchema.safeParse(input);
  if (!parsedInput.success) throw badRequest('Dados inválidos.');
  const { enabled, config } = parsedInput.data;
  const state = stateOf(definition);

  if (config) {
    const current = readConfig(definition, state) as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...current, ...config };
    // Segredo não alterado (veio mascarado): mantém o valor salvo.
    for (const key of secretKeys(definition)) if (config[key] === SECRET_MASK) merged[key] = current[key];
    const parsed = definition.configSchema.safeParse(merged);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw badRequest(
        `Configuração inválida${issue?.path.length ? ` (${issue.path.join('.')})` : ''}: ${issue?.message}`,
      );
    }
    const wasConfigured = isConfigured(definition, current, readTokens(state));
    const nowConfigured = isConfigured(definition, parsed.data, readTokens(state));
    saveState(id, {
      configEncrypted: encryptJson(parsed.data),
      enabled: enabled ?? (!wasConfigured && nowConfigured ? true : state.enabled),
      lastError: null,
      lastErrorAt: null,
    });
    resetFailures();
    log(id, 'info', 'config', 'Configuração salva.');
  }

  if (enabled !== undefined && enabled !== state.enabled) {
    saveState(id, { enabled });
    log(
      id,
      'info',
      enabled ? 'enable' : 'disable',
      enabled ? 'Integração ativada.' : 'Integração desativada.',
    );
  }

  return toView(definition);
}

/** Testa a conexão. */
export async function testIntegration(id: string): Promise<IntegrationActionResult> {
  const definition = requireDefinition(id);
  assertAvailable(definition);
  const context = buildContext(definition);
  try {
    const result = await definition.test(context);
    if (result.ok) recordSuccess(id, 'test', result.message, { lastTestAt: nowIso() });
    else recordFailure(id, 'test', new Error(result.message), { lastTestAt: nowIso() });
    return { ok: result.ok, message: result.message, integration: toView(definition) };
  } catch (error) {
    if (error instanceof IntegrationConfigError) {
      log(id, 'warning', 'test', error.message);
      return { ok: false, message: error.message, integration: toView(definition) };
    }
    const message = recordFailure(id, 'test', error, { lastTestAt: nowIso() });
    return { ok: false, message, integration: toView(definition) };
  }
}

const syncing = new Set<string>();

/** Sincroniza agora. */
export async function syncIntegration(id: string): Promise<IntegrationActionResult> {
  const definition = requireDefinition(id);
  assertAvailable(definition);
  const view = toView(definition);
  if (!definition.sync)
    return { ok: false, message: 'Esta integração não tem sincronização.', integration: view };
  if (!view.enabled)
    return { ok: false, message: 'Ative a integração antes de sincronizar.', integration: view };
  if (!view.configured)
    return { ok: false, message: 'Configure a integração antes de sincronizar.', integration: view };
  if (syncing.has(id)) return { ok: false, message: 'Já está sincronizando.', integration: view };

  syncing.add(id);
  try {
    const result = await definition.sync(buildContext(definition));
    recordSuccess(id, 'sync', result.message, { lastSyncAt: nowIso() });
    return { ok: true, message: result.message, integration: toView(definition) };
  } catch (error) {
    const message = recordFailure(id, 'sync', error, { lastSyncAt: nowIso() });
    return { ok: false, message, integration: toView(definition) };
  } finally {
    syncing.delete(id);
  }
}

/** Inicia a conexão. No OAuth devolve a URL de autorização; nas outras, ativa e testa. */
export async function connectIntegration(id: string): Promise<IntegrationActionResult> {
  const definition = requireDefinition(id);
  assertAvailable(definition);
  if (definition.connect) {
    try {
      const result = await definition.connect(buildContext(definition));
      log(id, 'info', 'connect', result.message);
      return { ok: true, message: result.message, authUrl: result.authUrl, integration: toView(definition) };
    } catch (error) {
      const message = error instanceof IntegrationConfigError ? error.message : describeError(error);
      log(id, 'warning', 'connect', message);
      return { ok: false, message, integration: toView(definition) };
    }
  }
  saveState(id, { enabled: true });
  return testIntegration(id);
}

/** Desconecta: apaga tokens e desativa (a configuração fica guardada para reconectar depois). */
export async function disconnectIntegration(id: string): Promise<IntegrationActionResult> {
  const definition = requireDefinition(id);
  assertAvailable(definition);
  try {
    await definition.disconnect?.(buildContext(definition));
  } catch (error) {
    log(id, 'warning', 'disconnect', `Aviso ao desconectar: ${describeError(error)}`);
  }
  saveState(id, {
    enabled: false,
    tokensEncrypted: null,
    needsReconnect: false,
    lastError: null,
    lastErrorAt: null,
  });
  log(id, 'info', 'disconnect', 'Integração desconectada.');
  return { ok: true, message: `${definition.name} desconectada.`, integration: toView(definition) };
}

/** Sincroniza todas as integrações ativas que têm sincronização. */
export async function syncAll(): Promise<{ ok: number; failed: number; results: IntegrationActionResult[] }> {
  const targets = listIntegrations().filter((i) => i.canSync && i.enabled && i.configured);
  const results = await Promise.all(targets.map((i) => syncIntegration(i.id)));
  return {
    ok: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  };
}

/** Chamado pelo agendador a cada minuto: sincroniza quem já passou do intervalo. */
export async function runScheduledSyncs(now: Date = new Date()): Promise<void> {
  for (const view of listIntegrations()) {
    if (!view.canSync || !view.enabled || !view.configured || !view.syncIntervalMinutes) continue;
    if (view.status === 'expirada') continue;
    const last = view.lastSyncAt ? new Date(view.lastSyncAt).getTime() : 0;
    if (now.getTime() - last >= view.syncIntervalMinutes * 60_000) await syncIntegration(view.id);
  }
}

/**
 * Pede um dado ao hub. Nunca lança erro: devolve o estado (ok, antigo, erro, não configurada...)
 * junto com o último dado em cache, para o card mostrar algo útil mesmo com falha.
 */
export async function fromHub<T, Params = void>(
  id: string,
  source: DataSource<never, T, Params>,
  params: Params,
  options: { force?: boolean } = {},
): Promise<HubResult<T>> {
  const definition = requireDefinition(id);
  const view = toView(definition);
  const base = { integrationId: id, data: null, fetchedAt: null };
  if (!view.enabled) return { ...base, state: 'disabled', error: `${definition.name} está desativada.` };
  if (!view.configured) {
    return { ...base, state: 'not_configured', error: `Configure ${definition.name} em Integrações.` };
  }

  const context = buildContext(definition);
  const typedSource = source as unknown as DataSource<unknown, T, Params>;
  try {
    const result = await getOrFetch(
      typedSource.key(context.config, params),
      typedSource.ttlMinutes,
      () => typedSource.fetch(context, params),
      options,
    );
    if (result.fresh) saveState(id, { lastSuccessAt: nowIso(), lastError: null, lastErrorAt: null });
    if (result.failedNow && result.error) recordFailure(id, 'fetch', new Error(result.error));
    return {
      integrationId: id,
      state: result.stale ? 'stale' : 'ok',
      data: result.data,
      fetchedAt: result.fetchedAt,
      error: result.error,
    };
  } catch (error) {
    const message = error instanceof BackoffError ? error.message : recordFailure(id, 'fetch', error);
    return { ...base, state: 'error', error: message };
  }
}

/** Executa uma chamada direta (sem cache) a uma integração, passando pelo hub. */
export async function callIntegration<T>(
  id: string,
  fn: (context: IntegrationContext<unknown>) => Promise<T>,
): Promise<T> {
  const definition = requireDefinition(id);
  return fn(buildContext(definition));
}

// ===== Dados que os módulos pedem ao hub =====

/** Clima da cidade configurada (Open-Meteo, cache de 30 min). */
export const getWeather = (options?: { force?: boolean }) =>
  fromHub('open-meteo', weatherSource, undefined, options);

/** Notícias de todos os feeds ativos (RSS, cache de 60 min). */
export const getNews = (options?: { force?: boolean }) => fromHub('rss', newsSource, undefined, options);

/** Busca de livros na Open Library (cache de 1 dia). */
export const searchBooks = (query: string) => fromHub('open-library', bookSearchSource, query);

/** Livros de um assunto na Open Library (cache de 1 semana). */
export const getBooksBySubject = (subject: string) => fromHub('open-library', subjectSource, subject);

/** Busca de cidades para configurar o clima (geocoding do Open-Meteo, cache de 1 dia). */
export async function searchCities(query: string): Promise<CityLocation[]> {
  const result = await getOrFetch(`geocode:${query.trim().toLowerCase()}`, 24 * 60, () =>
    searchCityApi(query),
  );
  return result.data;
}

/** Valida um endereço de feed RSS antes de salvar. */
export const validateFeedUrl = (url: string): Promise<NewsFeedValidation> => validateFeed(url);
