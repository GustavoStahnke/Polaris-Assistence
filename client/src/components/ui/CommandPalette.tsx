import type { LucideIcon } from 'lucide-react';
import { CornerDownLeft, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';
import { normalizeText } from '../../lib/text';
import { useUiStore } from '../../stores/uiStore';

export interface PaletteCommand {
  id: string;
  label: string;
  group: string;
  icon: LucideIcon;
  hint?: string;
  keywords?: string;
  run: () => void;
}

interface PaletteProps {
  commands: PaletteCommand[];
  /** Resultados extras vindos de uma busca (ex.: notas, livros). */
  extra?: PaletteCommand[];
  onQueryChange?: (query: string) => void;
  footer?: ReactNode;
}

/** Paleta de comandos (Ctrl+K / Cmd+K). */
export function CommandPalette(props: PaletteProps) {
  const { paletteOpen: open, setPaletteOpen: setOpen } = useUiStore();

  // Atalho global Ctrl+K / Cmd+K
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(!useUiStore.getState().paletteOpen);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]">
          <motion.div
            className="absolute inset-0 bg-bg-deep/75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <PaletteDialog {...props} onClose={() => setOpen(false)} />
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Conteúdo da paleta. É montado a cada abertura, então a busca sempre começa vazia. */
function PaletteDialog({
  commands,
  extra,
  onQueryChange,
  footer,
  onClose,
}: PaletteProps & { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(id);
  }, []);

  const results = useMemo(() => {
    const q = normalizeText(query.trim());
    const filtered = q
      ? commands.filter((c) => normalizeText(`${c.label} ${c.group} ${c.keywords ?? ''}`).includes(q))
      : commands;
    return [...(q ? (extra ?? []) : []), ...filtered];
  }, [commands, extra, query]);

  const grouped = useMemo(() => {
    const groups = new Map<string, PaletteCommand[]>();
    for (const item of results) groups.set(item.group, [...(groups.get(item.group) ?? []), item]);
    return [...groups.entries()];
  }, [results]);

  const execute = (command: PaletteCommand | undefined) => {
    if (!command) return;
    onClose();
    command.run();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      execute(results[activeIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  let flatIndex = -1;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Paleta de comandos"
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="glass relative w-full max-w-xl overflow-hidden bg-bg-base/95"
    >
      <div className="flex items-center gap-3 border-b border-border/60 px-4">
        <Search className="h-5 w-5 text-primary" aria-hidden />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
            onQueryChange?.(e.target.value);
          }}
          onKeyDown={onKeyDown}
          placeholder="Buscar ou digitar um comando…"
          aria-label="Buscar"
          className="h-14 flex-1 bg-transparent text-base text-text placeholder:text-text-faint focus:outline-none"
        />
        <kbd className="label-mono text-text-faint">Esc</kbd>
      </div>
      <div className="max-h-[50vh] overflow-y-auto p-2">
        {results.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-text-dim">Nada encontrado. Tente outra palavra.</p>
        )}
        {grouped.map(([group, items]) => (
          <div key={group} className="mb-1">
            <p className="label-mono px-3 pt-2 pb-1 text-text-dim">{group}</p>
            {items.map((item) => {
              flatIndex += 1;
              const index = flatIndex;
              const active = index === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => execute(item)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                    active ? 'bg-primary/15 text-star' : 'text-text',
                  )}
                >
                  <item.icon
                    className={cn('h-4 w-4 shrink-0', active ? 'text-star' : 'text-primary')}
                    aria-hidden
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.hint && <span className="truncate text-xs text-text-dim">{item.hint}</span>}
                  {active && <CornerDownLeft className="h-3.5 w-3.5 text-text-dim" aria-hidden />}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      {footer && <div className="border-t border-border/60 px-4 py-2">{footer}</div>}
    </motion.div>
  );
}
