import { MotionConfig, motion } from 'motion/react';
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Background } from '../components/core/Background';
import { MobileNav } from '../components/core/MobileNav';
import { Sidebar } from '../components/core/Sidebar';
import { TopBar } from '../components/core/TopBar';
import { Toaster } from '../components/ui/Toast';
import { useAppearanceStore, useReducedMotion } from '../stores/uiStore';
import { GlobalCommandPalette } from './GlobalCommandPalette';

/** Estrutura de todas as páginas: fundo, barra superior, barra lateral e conteúdo. */
export function Layout() {
  const location = useLocation();
  const glow = useAppearanceStore((s) => s.glow);
  const animations = useAppearanceStore((s) => s.animations);
  const reduced = useReducedMotion();

  // Aplica as preferências de aparência no documento inteiro.
  useEffect(() => {
    document.documentElement.style.setProperty('--glow-strength', String(glow));
    document.documentElement.dataset.motion = animations ? 'on' : 'off';
  }, [glow, animations]);

  return (
    <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>
      <Background />
      <TopBar integrations={{ connected: 0, available: 7, syncing: false }} />
      <Sidebar />
      <main className="pb-28 md:pb-12 md:pl-[72px]">
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
      <Toaster />
    </MotionConfig>
  );
}
