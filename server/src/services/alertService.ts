import type { DashboardAlert } from '@polaris/shared';
import { getWeatherReport } from './weatherService';

/**
 * Alertas do topo do Painel. Cada fonte é independente:
 * se uma falhar, as outras continuam aparecendo.
 */
export async function getDashboardAlerts(): Promise<DashboardAlert[]> {
  const alerts: DashboardAlert[] = [];
  try {
    const weather = await getWeatherReport();
    weather.alerts.forEach((a, i) =>
      alerts.push({
        id: `clima-${i}`,
        source: 'clima',
        message: a.message,
        severity: a.severity,
        to: '/clima',
      }),
    );
  } catch {
    // Clima indisponível: segue sem esse alerta.
  }
  return alerts;
}
