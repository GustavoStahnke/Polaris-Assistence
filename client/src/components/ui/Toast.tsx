import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../../lib/cn';
import { useToastStore, type ToastKind } from '../../stores/toastStore';

const icons: Record<ToastKind, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colors: Record<ToastKind, string> = {
  success: 'text-success border-success/40',
  error: 'text-danger border-danger/40',
  info: 'text-primary border-primary/40',
  warning: 'text-warning border-warning/40',
};

/** Área onde os toasts aparecem (canto inferior direito; acima da barra no celular). */
export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-40 z-[60] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2 md:bottom-24"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.kind];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className={cn(
                'glass pointer-events-auto flex items-start gap-3 bg-bg-base/90 p-3.5',
                colors[t.kind],
              )}
              role="status"
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text">{t.title}</p>
                {t.message && <p className="mt-0.5 text-xs text-text-dim">{t.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Fechar aviso"
                className="text-text-dim hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
