import type { Reminder } from '@polaris/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { toast } from '../../stores/toastStore';

/**
 * Fica de olho nos lembretes: a cada 30 segundos pergunta ao servidor quais venceram,
 * mostra um toast e uma notificação do navegador, e confirma (o servidor agenda a próxima vez).
 */
export function ReminderWatcher() {
  const queryClient = useQueryClient();
  const notified = useRef(new Set<string>());
  const due = useQuery({
    queryKey: ['reminders', 'due'],
    queryFn: () => api.get<Reminder[]>('/reminders/due'),
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
  });

  useEffect(() => {
    for (const reminder of due.data ?? []) {
      const key = `${reminder.id}:${reminder.remindAt}`;
      if (notified.current.has(key)) continue;
      notified.current.add(key);
      toast.info(`Lembrete: ${reminder.title}`, reminder.notes ?? undefined);
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        try {
          new Notification('Polaris · Lembrete', {
            body: reminder.title,
            icon: '/polaris-star.svg',
            tag: key,
          });
        } catch {
          // Alguns navegadores (ex.: celular) só notificam via service worker; o toast já aparece.
        }
      }
      void api.post(`/reminders/${reminder.id}/ack`).then(() => {
        void queryClient.invalidateQueries({ queryKey: ['reminders'] });
        void queryClient.invalidateQueries({ queryKey: ['tasks', 'today'] });
      });
    }
  }, [due.data, queryClient]);

  return null;
}
