import type { CalendarInfo } from '@polaris/shared';
import { useQuery } from '@tanstack/react-query';
import { Checkbox } from '../../../components/ui/Input';
import { api, errorMessage } from '../../../lib/api';
import type { WidgetProps } from './types';

/** Escolha dos calendários do Google que aparecem no Polaris. */
export function CalendarSelect({ value, onChange }: WidgetProps) {
  const selected = Array.isArray(value) ? (value as string[]) : [];
  const calendars = useQuery({
    queryKey: ['google-calendars'],
    queryFn: () => api.get<CalendarInfo[]>('/integrations/google-calendar/calendars'),
    retry: 0,
  });

  if (calendars.isPending) return <p className="text-sm text-text-dim">Carregando calendários…</p>;
  if (calendars.isError) {
    return (
      <p className="text-sm text-text-dim">
        Conecte a Conta Google para escolher os calendários. ({errorMessage(calendars.error)})
      </p>
    );
  }
  return (
    <div className="space-y-2 rounded-xl border border-border/60 p-3">
      {calendars.data.map((c) => {
        const checked = selected.includes(c.id) || (selected.length === 0 && c.primary);
        return (
          <div key={c.id} className="flex items-center gap-2">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ background: c.color ?? '#38BDF8' }}
              aria-hidden
            />
            <Checkbox
              checked={checked}
              label={`${c.name}${c.primary ? ' (principal)' : ''}`}
              onChange={(on) => {
                const base =
                  selected.length === 0 ? calendars.data.filter((x) => x.primary).map((x) => x.id) : selected;
                onChange(on ? [...new Set([...base, c.id])] : base.filter((id) => id !== c.id));
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
