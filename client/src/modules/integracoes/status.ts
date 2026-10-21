import type { IntegrationStatus } from '@polaris/shared';
import type { BadgeTone } from '../../components/ui/Badge';

/** Rótulo e cor de cada status (CONECTADO verde, ERRO vermelho, RECONECTAR amarelo...). */
export const STATUS_META: Record<IntegrationStatus, { label: string; tone: BadgeTone; color: string }> = {
  conectada: { label: 'Conectado', tone: 'success', color: '#34D399' },
  erro: { label: 'Erro', tone: 'danger', color: '#F87171' },
  expirada: { label: 'Reconectar', tone: 'warning', color: '#FBBF24' },
  desativada: { label: 'Desativado', tone: 'muted', color: '#5B6F95' },
  nao_configurada: { label: 'Configurar', tone: 'primary', color: '#38BDF8' },
  em_breve: { label: 'Em breve', tone: 'star', color: '#5B6F95' },
};
