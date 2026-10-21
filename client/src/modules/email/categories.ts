import type { EmailCategory } from '@polaris/shared';
import type { BadgeTone } from '../../components/ui/Badge';

export const CATEGORY_TONES: Record<EmailCategory, BadgeTone> = {
  urgente: 'danger',
  responder: 'warning',
  pode_esperar: 'primary',
  ignorar: 'muted',
};
