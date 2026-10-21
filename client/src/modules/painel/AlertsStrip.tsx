import { AlertTriangle, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { cn } from '../../lib/cn';
import { useAlerts } from './useAlerts';

/** Alertas no topo do Painel ("Vai chover às 16h.", "Reunião em 20 minutos."...). */
export function AlertsStrip() {
  const alerts = useAlerts();
  if (!alerts.data?.length) return null;
  return (
    <div className="mb-5 flex flex-wrap gap-2" role="status">
      {alerts.data.map((alert, i) => {
        const Icon = alert.severity === 'warning' ? AlertTriangle : Info;
        return (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              to={alert.to}
              className={cn(
                'flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                alert.severity === 'warning'
                  ? 'border-warning/40 bg-warning/10 text-warning hover:border-warning'
                  : 'border-primary/40 bg-primary/10 text-primary hover:border-primary',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden /> {alert.message}
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
