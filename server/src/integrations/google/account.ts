import { gmail } from 'googleapis/build/src/apis/gmail';
import { z } from 'zod';
import { defineIntegration, IntegrationConfigError } from '../types';
import {
  authorizedClient,
  createAuthState,
  createOAuthClient,
  getGoogleRedirectUri,
  GOOGLE_SCOPES,
  withGoogle,
  type GoogleAccountConfig,
  type GoogleTokens,
} from './auth';

export const googleAccountConfigSchema = z.object({
  clientId: z
    .string()
    .trim()
    .default('')
    .meta({ title: 'Client ID', description: 'Termina com .apps.googleusercontent.com' }),
  clientSecret: z.string().trim().default('').meta({ title: 'Client Secret', secret: true }),
});

/** E-mail da conta conectada. */
export async function fetchAccountEmail(client: ReturnType<typeof createOAuthClient>): Promise<string> {
  const profile = await gmail({ version: 'v1', auth: client }).users.getProfile({ userId: 'me' });
  return profile.data.emailAddress ?? 'conta Google';
}

export const googleAccount = defineIntegration<GoogleAccountConfig>({
  id: 'google-account',
  name: 'Conta Google',
  category: 'google',
  description: 'Login seguro (OAuth) para ler sua Agenda e seu Gmail. Somente leitura.',
  icon: 'KeyRound',
  authType: 'oauth2',
  availability: 'available',
  free: true,
  configSchema: googleAccountConfigSchema,
  isConfigured: (config, tokens) =>
    Boolean(config.clientId && config.clientSecret && (tokens as GoogleTokens | null)?.refresh_token),
  getAccount: (tokens) => (tokens as GoogleTokens | null)?.email ?? null,
  guide: {
    title: 'Como conectar sua Conta Google (uma vez só)',
    steps: [
      'Acesse o **Google Cloud Console** (console.cloud.google.com) e crie um projeto chamado `Polaris`.',
      'Em "APIs e serviços › Biblioteca", ative a **Google Calendar API** e a **Gmail API**.',
      'Em "Tela de consentimento OAuth", escolha o tipo **Externo**, deixe o status em **Teste** e adicione o seu próprio e-mail como **usuário de teste**.',
      'Em "Credenciais", crie um **ID do cliente OAuth** do tipo **Aplicativo da Web**, com o URI de redirecionamento `http://localhost:3001/api/integrations/google/callback`.',
      'Copie o **Client ID** e o **Client Secret**, cole na aba Configuração, clique em **Salvar** e depois em **Conectar**.',
    ],
    notes: [
      'Em modo de teste, o Google expira o acesso a cada 7 dias. Quando isso acontecer, o status vira RECONECTAR e basta um clique em "Reconectar" para renovar.',
      'O Polaris pede só permissão de leitura (agenda e e-mails). Nada é enviado, apagado ou alterado.',
    ],
  },
  async connect({ config }) {
    const client = createOAuthClient(config);
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: true,
      scope: GOOGLE_SCOPES,
      state: createAuthState(),
    });
    return { authUrl, message: `Abrindo o login do Google (retorno em ${getGoogleRedirectUri()}).` };
  },
  async disconnect(ctx) {
    const tokens = ctx.tokens as GoogleTokens | null;
    if (!tokens?.refresh_token || !ctx.config.clientId) return;
    await createOAuthClient(ctx.config).revokeToken(tokens.refresh_token);
  },
  async test(ctx) {
    if (!(ctx.tokens as GoogleTokens | null)?.refresh_token) {
      throw new IntegrationConfigError(
        'Ainda não conectada: salve o Client ID e o Client Secret e clique em Conectar.',
      );
    }
    const email = await withGoogle(() => fetchAccountEmail(authorizedClient(ctx)));
    return { ok: true, message: `Conectado como ${email}.` };
  },
});

/** Troca o código do retorno do OAuth pelos tokens e descobre o e-mail da conta. */
export async function completeAuthorization(
  config: GoogleAccountConfig,
  previous: GoogleTokens | null,
  code: string,
): Promise<GoogleTokens> {
  const client = createOAuthClient(config);
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  const email = await fetchAccountEmail(client);
  return {
    ...previous,
    ...tokens,
    // O Google só manda o refresh_token na primeira autorização; guardamos o anterior se vier vazio.
    refresh_token: tokens.refresh_token ?? previous?.refresh_token ?? null,
    email,
  };
}
