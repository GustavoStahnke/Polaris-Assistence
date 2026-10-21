import { Ellipsis, MessageCircle } from 'lucide-react';
import { NavLink, useLocation } from 'react-router';
import { NAV_ITEMS } from '../../app/navigation';
import { cn } from '../../lib/cn';
import { useUiStore } from '../../stores/uiStore';
import { Modal } from '../ui/Modal';

/** Barra inferior do celular: Painel, Agenda, Livros, Treino e Mais. */
export function MobileNav() {
  const { moreOpen, setMoreOpen, setChatOpen } = useUiStore();
  const location = useLocation();
  const mainItems = NAV_ITEMS.filter((item) => item.mobile);
  const moreItems = NAV_ITEMS.filter((item) => !item.mobile);
  const moreActive = moreItems.some((item) => location.pathname.startsWith(item.path));

  const itemClass = (active: boolean) =>
    cn(
      'flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-mono uppercase tracking-[0.12em] transition-colors',
      active ? 'text-star' : 'text-text-dim',
    );

  return (
    <>
      <nav
        aria-label="Navegação"
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border/50 bg-bg-deep/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
      >
        {mainItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => itemClass(isActive)}
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn('h-5 w-5', isActive && 'drop-shadow-[0_0_6px_rgba(56,189,248,0.9)]')}
                  aria-hidden
                />
                {item.mobileLabel ?? item.label}
              </>
            )}
          </NavLink>
        ))}
        <button type="button" onClick={() => setMoreOpen(true)} className={itemClass(moreActive)}>
          <Ellipsis className="h-5 w-5" aria-hidden />
          Mais
        </button>
      </nav>

      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="Mais módulos">
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setMoreOpen(false);
              setChatOpen(true);
            }}
            className="flex flex-col items-center gap-2 rounded-xl border border-primary/50 bg-primary/10 p-3 text-center text-xs text-star"
          >
            <MessageCircle className="h-5 w-5" aria-hidden />
            Canal Polaris
          </button>
          {moreItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMoreOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-2 rounded-xl border p-3 text-center text-xs transition-colors',
                  isActive
                    ? 'border-primary bg-primary/15 text-star'
                    : 'border-border text-text-dim hover:text-star',
                )
              }
            >
              <item.icon className="h-5 w-5" aria-hidden />
              {item.label}
            </NavLink>
          ))}
        </div>
      </Modal>
    </>
  );
}
