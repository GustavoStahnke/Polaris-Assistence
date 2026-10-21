import { z } from 'zod';
import { defineIntegration, type IntegrationDefinition } from './types';

// Integrações planejadas: aparecem como cards "EM BREVE" para mostrar o que vem por aí.

const soon = (
  definition: Pick<
    IntegrationDefinition,
    'id' | 'name' | 'category' | 'description' | 'icon' | 'authType' | 'free'
  >,
) =>
  defineIntegration<Record<string, never>>({
    ...definition,
    availability: 'soon',
    configSchema: z.object({}),
    async test() {
      return { ok: false, message: 'Esta integração ainda não está disponível.' };
    },
  });

export const soonIntegrations = [
  soon({
    id: 'supabase',
    name: 'Supabase',
    category: 'nuvem',
    description: 'Sincronização na nuvem para usar o Polaris de qualquer lugar (Fase 3).',
    icon: 'Cloud',
    authType: 'apiKey',
    free: true,
  }),
  soon({
    id: 'google-drive',
    name: 'Google Drive',
    category: 'nuvem',
    description: 'Backup automático do banco na sua conta do Google.',
    icon: 'HardDrive',
    authType: 'oauth2',
    free: true,
  }),
  soon({
    id: 'telegram',
    name: 'Telegram',
    category: 'produtividade',
    description: 'Notificações e lembretes direto no celular.',
    icon: 'Send',
    authType: 'apiKey',
    free: true,
  }),
  soon({
    id: 'spotify',
    name: 'Spotify',
    category: 'musica',
    description: 'Tocar suas playlists para focar ou treinar.',
    icon: 'Music',
    authType: 'oauth2',
    free: true,
  }),
  soon({
    id: 'google-fit',
    name: 'Google Fit / relógio',
    category: 'saude',
    description: 'Passos e sono do seu relógio ou celular.',
    icon: 'HeartPulse',
    authType: 'oauth2',
    free: true,
  }),
  soon({
    id: 'cotacoes',
    name: 'Cotações',
    category: 'financas',
    description: 'Dólar, euro e bitcoin para o módulo de finanças.',
    icon: 'TrendingUp',
    authType: 'none',
    free: true,
  }),
  soon({
    id: 'ia-nuvem',
    name: 'IA na nuvem',
    category: 'ia',
    description: 'Claude ou outra IA na nuvem. Opcional e pago por uso.',
    icon: 'Sparkles',
    authType: 'apiKey',
    free: false,
  }),
];
