import { MotionConfig, motion } from 'motion/react';
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Background } from '../components/core/Background';
import { MobileNav } from '../components/core/MobileNav';
import { Sidebar } from '../components/core/Sidebar';
import { TopBar } from '../components/core/TopBar';
import { Toaster } from '../components/ui/Toast';
import { cn } from '../lib/cn';
import { ChatDrawer } from '../modules/ia/ChatDrawer';
import { useIntegrations, useIsSyncing } from '../modules/integracoes/api';
import { ReminderWatcher } from '../modules/tarefas/ReminderWatcher';
import { useAppearanceStore, useReducedMotion } from '../stores/uiStore';
import { AuthGate } from './AuthGate';
import { GlobalCommandPalette } from './GlobalCommandPalette';
import { SIDEBAR_WIDTH } from './navigation';
import { QuickActions } from './QuickActions';

/** Estrutura de todas as páginas. No celular (modo rede local), pede o PIN antes. */
export function Layout() {
  return (
    <AuthGate>
      <LayoutShell />
    </AuthGate>
  );
}

/** Fundo, barra superior, barra lateral, conteúdo e os componentes globais. */
function LayoutShell() {
  const location = useLocation();
  const glow = useAppearanceStore((s) => s.glow);
  const animations = useAppearanceStore((s) => s.animations);
  const sidebarExpanded = useAppearanceStore((s) => s.sidebarExpanded);
  const reduced = useReducedMotion();
  const integrations = useIntegrations();
  const syncing = useIsSyncing();
  const summary = integrations.data && {
    connected: integrations.data.filter((i) => i.status === 'conectada').length,
    available: integrations.data.filter((i) => i.availability === 'available').length,
    syncing,
  };

  // Aplica as preferências de aparência no documento inteiro.
  useEffect(() => {
    document.documentElement.style.setProperty('--glow-strength', String(glow));
    document.documentElement.dataset.motion = animations ? 'on' : 'off';
  }, [glow, animations]);

  return (
    <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>
      <Background />
      <TopBar integrations={summary || undefined} />
      <Sidebar />
      <main
        className={cn(
          'pb-28 transition-[padding] duration-300 md:pb-12',
          sidebarExpanded ? SIDEBAR_WIDTH.expanded : SIDEBAR_WIDTH.collapsed,
        )}
      >
        <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>
      <MobileNav />
      <GlobalCommandPalette />
      <QuickActions />
      <ReminderWatcher />
      <ChatDrawer />
      <Toaster />
    </MotionConfig>
  );
}
