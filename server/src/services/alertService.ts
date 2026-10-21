import type { DashboardAlert } from '@polaris/shared';
import { getAgenda } from './agendaService';
import { getEmails } from './emailService';
import { getWeatherReport } from './weatherService';

/**
 * Alertas do topo do Painel. Cada fonte é independente:
 * se uma falhar, as outras continuam aparecendo.
 */
export async function getDashboardAlerts(now: Date = new Date()): Promise<DashboardAlert[]> {
  const [weather, agenda, emails] = await Promise.allSettled([
    getWeatherReport(),
    getAgenda('hoje', now),
    getEmails(),
  ]);
  const alerts: DashboardAlert[] = [];

  if (agenda.status === 'fulfilled') {
    for (const item of agenda.value.items) {
      if (item.allDay) continue;
      const minutes = Math.round((new Date(item.start).getTime() - now.getTime()) / 60_000);
      if (minutes >= 0 && minutes <= 60) {
        alerts.push({
          id: `agenda-${item.id}`,
          source: 'agenda',
          message: minutes <= 1 ? `${item.title} começando agora.` : `${item.title} em ${minutes} minutos.`,
          severity: minutes <= 20 ? 'warning' : 'info',
          to: '/agenda',
        });
      }
    }
  }
  if (emails.status === 'fulfilled' && emails.value.counts.urgente > 0) {
    const n = emails.value.counts.urgente;
    alerts.push({
      id: 'email-urgente',
      source: 'email',
      message: n === 1 ? '1 e-mail urgente.' : `${n} e-mails urgentes.`,
      severity: 'warning',
      to: '/email',
    });
  }
  if (weather.status === 'fulfilled') {
    weather.value.alerts.forEach((a, i) =>
      alerts.push({
        id: `clima-${i}`,
        source: 'clima',
        message: a.message,
        severity: a.severity,
        to: '/clima',
      }),
    );
  }
  return alerts;
}
