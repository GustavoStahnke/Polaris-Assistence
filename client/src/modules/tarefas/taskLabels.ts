import { toDateKey, type TaskPriority } from '@polaris/shared';
import type { BadgeTone } from '../../components/ui/Badge';
import { formatShortDate } from '../../lib/format';

export const PRIORITY_TONES: Record<TaskPriority, BadgeTone> = {
  alta: 'danger',
  media: 'warning',
  baixa: 'muted',
};

/** "Hoje", "Amanhã", "Atrasada (20/10)" ou a data. */
export function dueLabel(dueDate: string, today = toDateKey()): { text: string; tone: BadgeTone } {
  const tomorrow = toDateKey(new Date(Date.now() + 86400000));
  if (dueDate < today)
    return { text: `Atrasada · ${formatShortDate(`${dueDate}T12:00:00`).slice(0, 5)}`, tone: 'danger' };
  if (dueDate === today) return { text: 'Hoje', tone: 'warning' };
  if (dueDate === tomorrow) return { text: 'Amanhã', tone: 'primary' };
  return { text: formatShortDate(`${dueDate}T12:00:00`).slice(0, 5), tone: 'muted' };
}
