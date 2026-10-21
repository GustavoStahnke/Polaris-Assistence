import type { LucideIcon } from 'lucide-react';
import { MessageCircle, Search } from 'lucide-react';
import { useState, type FocusEvent, type MouseEvent } from 'react';
import { NavLink } from 'react-router';
import { NAV_ITEMS } from '../../app/navigation';
import { cn } from '../../lib/cn';
import { useAppearanceStore, useUiStore } from '../../stores/uiStore';

interface TooltipState {
  label: string;
  top: number;
}

/**
 * Barra lateral (desktop). Fina, só com ícones e tooltips, ou expandida, com o nome de cada módulo.
 * O botão para alternar fica na barra superior, ao lado do logo. Em telas baixas, a barra rola.
 */
export function Sidebar() {
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const setChatOpen = useUiStore((s) => s.setChatOpen);
  const expanded = useAppearanceStore((s) => s.sidebarExpanded);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const showTooltip = (element: HTMLElement, label: string) => {
    const rect = element.getBoundingClientRect();
    setTooltip({ label, top: rect.top + rect.height / 2 });
  };

  // No modo fino, o nome aparece num tooltip com posição fixa (assim a rolagem da barra não o corta).
  const tooltipHandlers = (label: string) =>
    expanded
      ? {}
      : {
          onMouseEnter: (e: MouseEvent<HTMLElement>) => showTooltip(e.currentTarget, label),
          onFocus: (e: FocusEvent<HTMLElement>) => showTooltip(e.currentTarget, label),
          onMouseLeave: () => setTooltip(null),
          onBlur: () => setTooltip(null),
        };

  return (
    <>
      <nav
        aria-label="Navegação principal"
        onScroll={() => setTooltip(null)}
        className={cn(
          'fixed top-16 bottom-0 left-0 z-20 hidden flex-col gap-1 overflow-x-hidden overflow-y-auto border-r border-border/40 bg-bg-deep/50 py-4 backdrop-blur-md transition-[width] duration-300 [scrollbar-width:thin] md:flex',
          expanded ? 'w-[232px] px-3' : 'w-[72px] items-center',
        )}
      >
        <SidebarButton
          icon={Search}
          label="Buscar"
          hint="Ctrl K"
          expanded={expanded}
          onClick={() => setPaletteOpen(true)}
          {...tooltipHandlers('Buscar · Ctrl K')}
        />
        <SidebarButton
          icon={MessageCircle}
          label="Canal Polaris"
          expanded={expanded}
          onClick={() => setChatOpen(true)}
          {...tooltipHandlers('Canal Polaris')}
        />
        <div className={cn('my-1 h-px shrink-0 bg-border/60', expanded ? 'w-full' : 'w-8')} />

        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            aria-label={item.label}
            {...tooltipHandlers(item.label)}
            className={({ isActive }) =>
              cn(
                itemBase(expanded),
                isActive
                  ? 'border-primary/60 bg-primary/15 text-star shadow-[0_0_calc(18px*var(--glow-strength))_rgba(56,189,248,calc(0.45*var(--glow-strength)))]'
                  : 'border-transparent text-text-dim hover:border-border hover:text-star',
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0" aria-hidden />
            {expanded && <span className="truncate text-sm font-medium whitespace-nowrap">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {tooltip && !expanded && (
        <span
          role="tooltip"
          style={{ top: tooltip.top }}
          className="label-mono pointer-events-none fixed left-[80px] z-50 hidden -translate-y-1/2 rounded-lg border border-border bg-bg-base px-2.5 py-1.5 whitespace-nowrap text-text shadow-lg md:block"
        >
          {tooltip.label}
        </span>
      )}
    </>
  );
}

const itemBase = (expanded: boolean) =>
  cn(
    'group relative flex h-10 shrink-0 items-center rounded-xl border transition-all',
    expanded ? 'w-full gap-3 px-3' : 'w-10 justify-center',
  );

function SidebarButton({
  icon: Icon,
  label,
  hint,
  expanded,
  onClick,
  ...handlers
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  expanded: boolean;
  onClick: () => void;
  onMouseEnter?: (e: MouseEvent<HTMLElement>) => void;
  onMouseLeave?: () => void;
  onFocus?: (e: FocusEvent<HTMLElement>) => void;
  onBlur?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      {...handlers}
      className={cn(
        itemBase(expanded),
        'border-transparent text-text-dim hover:border-border hover:text-star',
      )}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      {expanded && (
        <span className="flex min-w-0 flex-1 items-center justify-between gap-2 text-sm font-medium whitespace-nowrap">
          <span className="truncate">{label}</span>
          {hint && <kbd className="label-mono text-[9px] text-text-faint">{hint}</kbd>}
        </span>
      )}
    </button>
  );
}
