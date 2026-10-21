import type { LucideIcon } from 'lucide-react';
import { ChevronsLeft, ChevronsRight, MessageCircle, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { NAV_ITEMS } from '../../app/navigation';
import { cn } from '../../lib/cn';
import { useAppearanceStore, useUiStore } from '../../stores/uiStore';

/**
 * Barra lateral (desktop). Fina, só com ícones e tooltips, ou expandida, com o nome de cada módulo.
 * O botão no rodapé alterna entre as duas, e a escolha fica salva neste navegador.
 */
export function Sidebar() {
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const setChatOpen = useUiStore((s) => s.setChatOpen);
  const expanded = useAppearanceStore((s) => s.sidebarExpanded);
  const setAppearance = useAppearanceStore((s) => s.setAppearance);

  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        'fixed top-16 bottom-0 left-0 z-20 hidden flex-col gap-1.5 border-r border-border/40 bg-bg-deep/50 py-4 backdrop-blur-md transition-[width] duration-300 md:flex',
        expanded ? 'w-[232px] px-3' : 'w-[72px] items-center',
      )}
    >
      <SidebarItem
        icon={Search}
        label="Buscar"
        hint="Ctrl K"
        expanded={expanded}
        onClick={() => setPaletteOpen(true)}
      />
      <SidebarItem
        icon={MessageCircle}
        label="Canal Polaris"
        expanded={expanded}
        onClick={() => setChatOpen(true)}
      />
      <div className={cn('my-1 h-px bg-border/60', expanded ? 'w-full' : 'w-8')} />

      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          aria-label={item.label}
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
          <ItemLabel expanded={expanded}>{item.label}</ItemLabel>
        </NavLink>
      ))}

      <div className="mt-auto pt-2">
        <SidebarItem
          icon={expanded ? ChevronsLeft : ChevronsRight}
          label={expanded ? 'Recolher menu' : 'Expandir menu'}
          expanded={expanded}
          onClick={() => setAppearance({ sidebarExpanded: !expanded })}
          ariaExpanded={expanded}
        />
      </div>
    </nav>
  );
}

const itemBase = (expanded: boolean) =>
  cn(
    'group relative flex h-11 shrink-0 items-center rounded-xl border transition-all',
    expanded ? 'w-full gap-3 px-3' : 'w-11 justify-center',
  );

function SidebarItem({
  icon: Icon,
  label,
  hint,
  expanded,
  onClick,
  ariaExpanded,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  expanded: boolean;
  onClick: () => void;
  ariaExpanded?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={ariaExpanded}
      className={cn(
        itemBase(expanded),
        'border-transparent text-text-dim hover:border-border hover:text-star',
      )}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      <ItemLabel expanded={expanded} hint={hint}>
        {label}
      </ItemLabel>
    </button>
  );
}

/** Nome do item: aparece ao lado do ícone (expandida) ou como tooltip (fina). */
function ItemLabel({ expanded, hint, children }: { expanded: boolean; hint?: string; children: ReactNode }) {
  if (expanded) {
    return (
      <span className="flex min-w-0 flex-1 items-center justify-between gap-2 text-sm font-medium whitespace-nowrap">
        <span className="truncate">{children}</span>
        {hint && <kbd className="label-mono text-[9px] text-text-faint">{hint}</kbd>}
      </span>
    );
  }
  return (
    <span
      role="tooltip"
      className="label-mono pointer-events-none absolute left-full z-50 ml-3 rounded-lg border border-border bg-bg-base px-2.5 py-1.5 whitespace-nowrap text-text opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {children}
      {hint && <span className="ml-2 text-text-faint">{hint}</span>}
    </span>
  );
}
