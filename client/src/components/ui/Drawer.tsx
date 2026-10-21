import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';
import { Button } from './Button';

/** Gaveta lateral (direita). Fecha com Esc ou clicando fora. */
export function Drawer({
  open,
  onClose,
  title,
  label,
  children,
  footer,
  width = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  label?: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-bg-deep/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 260 }}
            className={cn(
              'absolute inset-y-0 right-0 flex w-full flex-col border-l border-border bg-bg-base/95 shadow-[0_0_60px_rgba(56,189,248,0.15)] backdrop-blur-xl focus:outline-none',
              width,
            )}
          >
            <header className="flex items-start justify-between gap-3 border-b border-border/60 p-5">
              <div className="min-w-0">
                {label && <p className="label-mono text-text-dim">{label}</p>}
                <h2 className="mt-0.5 text-lg font-semibold">{title}</h2>
              </div>
              <Button variant="ghost" size="icon" icon={X} onClick={onClose} aria-label="Fechar" />
            </header>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
            {footer && <footer className="border-t border-border/60 p-4">{footer}</footer>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
