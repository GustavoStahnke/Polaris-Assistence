import { MessageCircle, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { NAV_ITEMS } from '../../app/navigation';
import { cn } from '../../lib/cn';
import { useUiStore } from '../../stores/uiStore';

/** Barra lateral fina, só com ícones e tooltips (desktop). */
export function Sidebar() {
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const setChatOpen = useUiStore((s) => s.setChatOpen);
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed top-16 bottom-0 left-0 z-20 hidden w-[72px] flex-col items-center gap-1.5 border-r border-border/40 bg-bg-deep/50 py-4 backdrop-blur-md md:flex"
    >
      <SidebarButton label="Buscar (Ctrl+K)" onClick={() => setPaletteOpen(true)}>
        <Search className="h-5 w-5" />
      </SidebarButton>
      <SidebarButton label="Canal Polaris" onClick={() => setChatOpen(true)}>
        <MessageCircle className="h-5 w-5" />
      </SidebarButton>
      <div className="my-1 h-px w-8 bg-border/60" />
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          aria-label={item.label}
          className={({ isActive }) =>
            cn(
              'group relative flex h-11 w-11 items-center justify-center rounded-xl border transition-all',
              isActive
                ? 'border-primary/60 bg-primary/15 text-star shadow-[0_0_calc(18px*var(--glow-strength))_rgba(56,189,248,calc(0.45*var(--glow-strength)))]'
                : 'border-transparent text-text-dim hover:border-border hover:text-star',
            )
          }
        >
          <item.icon className="h-5 w-5" aria-hidden />
          <Tooltip>{item.label}</Tooltip>
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="group relative flex h-11 w-11 items-center justify-center rounded-xl border border-transparent text-text-dim transition-all hover:border-border hover:text-star"
    >
      {children}
      <Tooltip>{label}</Tooltip>
    </button>
  );
}

function Tooltip({ children }: { children: ReactNode }) {
  return (
    <span
      role="tooltip"
      className="label-mono pointer-events-none absolute left-full z-50 ml-3 rounded-lg border border-border bg-bg-base px-2.5 py-1.5 whitespace-nowrap text-text opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {children}
    </span>
  );
}
