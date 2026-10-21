import { auth } from 'googleapis/build/src/apis/calendar';
import { randomBytes } from 'node:crypto';
import { IntegrationAuthError, IntegrationConfigError, type IntegrationContext } from '../types';

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
];

export type OAuthClient = InstanceType<typeof auth.OAuth2>;

export interface GoogleAccountConfig {
  clientId: string;
  clientSecret: string;
}

export interface GoogleTokens {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
  scope?: string;
  token_type?: string | null;
  email?: string;
}

let redirectUri = 'http://localhost:3001/api/integrations/google/callback';

/** Definido no start do servidor (depende da porta configurada). */
export function setGoogleRedirectUri(uri: string) {
  redirectUri = uri;
}
export const getGoogleRedirectUri = () => redirectUri;

export function createOAuthClient(config: GoogleAccountConfig): OAuthClient {
  if (!config.clientId || !config.clientSecret) {
    throw new IntegrationConfigError('Preencha o Client ID e o Client Secret da Conta Google.');
  }
  return new auth.OAuth2(config.clientId, config.clientSecret, redirectUri);
}

// "state" do OAuth: protege contra pedidos forjados (CSRF). Vale por 10 minutos.
const pendingStates = new Map<string, number>();

export function createAuthState(): string {
  const now = Date.now();
  for (const [state, at] of pendingStates) if (now - at > 10 * 60_000) pendingStates.delete(state);
  const state = randomBytes(16).toString('hex');
  pendingStates.set(state, now);
  return state;
}

export function consumeAuthState(state: string | undefined): boolean {
  if (!state || !pendingStates.has(state)) return false;
  const valid = Date.now() - pendingStates.get(state)! <= 10 * 60_000;
  pendingStates.delete(state);
  return valid;
}

/** O Google responde "invalid_grant" quando o acesso expira (a cada 7 dias em modo de teste). */
export function isExpiredGrant(error: unknown): boolean {
  const data = (error as { response?: { data?: { error?: string } } }).response?.data;
  const message = (error as Error).message ?? '';
  return data?.error === 'invalid_grant' || /invalid_grant|Token has been expired or revoked/i.test(message);
}

/**
 * Cliente autenticado a partir do contexto da Conta Google.
 * Quando o Google renova o token, os novos dados são salvos (criptografados).
 */
export function authorizedClient(account: IntegrationContext<GoogleAccountConfig>): OAuthClient {
  const tokens = account.tokens as GoogleTokens | null;
  if (!tokens?.refresh_token) throw new IntegrationConfigError('Conecte a Conta Google em Integrações.');
  const client = createOAuthClient(account.config);
  client.setCredentials(tokens);
  client.on('tokens', (fresh) => {
    account.saveTokens({ ...tokens, ...fresh, refresh_token: fresh.refresh_token ?? tokens.refresh_token });
  });
  return client;
}

/** Executa uma chamada ao Google, traduzindo "acesso expirado" para o status RECONECTAR. */
export async function withGoogle<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (isExpiredGrant(error)) {
      throw new IntegrationAuthError(
        'O acesso ao Google expirou (em modo de teste isso acontece a cada 7 dias). Clique em Reconectar.',
        { cause: error },
      );
    }
    const status =
      (error as { code?: number; status?: number }).code ?? (error as { status?: number }).status;
    if (status === 403)
      throw new Error('O Google negou o acesso. Verifique se a API está ativada no Google Cloud Console.', {
        cause: error,
      });
    if (status === 401)
      throw new IntegrationAuthError('A autorização do Google não é mais válida. Clique em Reconectar.', {
        cause: error,
      });
    throw error;
  }
}
