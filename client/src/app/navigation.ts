import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  CalendarDays,
  CloudSun,
  Dumbbell,
  LayoutDashboard,
  ListTodo,
  Mail,
  Newspaper,
  Settings,
  StickyNote,
  Target,
} from 'lucide-react';

export interface NavItem {
  path: string;
  label: string;
  /** Nome curto na barra inferior do celular */
  mobileLabel?: string;
  icon: LucideIcon;
  /** Aparece direto na barra do celular (os outros ficam em "Mais") */
  mobile?: boolean;
}

/** Todos os módulos do sistema, na ordem da barra lateral. */
export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Painel', icon: LayoutDashboard, mobile: true },
  { path: '/agenda', label: 'Agenda', icon: CalendarDays, mobile: true },
  { path: '/email', label: 'E-mail', icon: Mail },
  { path: '/noticias', label: 'Notícias', icon: Newspaper },
  { path: '/clima', label: 'Clima', icon: CloudSun },
  { path: '/biblioteca', label: 'Biblioteca', mobileLabel: 'Livros', icon: BookOpen, mobile: true },
  { path: '/academia', label: 'Treino', mobileLabel: 'Treino', icon: Dumbbell, mobile: true },
  { path: '/notas', label: 'Notas', icon: StickyNote },
  { path: '/tarefas', label: 'Tarefas', icon: ListTodo },
  { path: '/habitos', label: 'Hábitos', icon: Target },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
];

/** Espaço reservado para a barra lateral no desktop (fina ou expandida). */
export const SIDEBAR_WIDTH = { collapsed: 'md:pl-[72px]', expanded: 'md:pl-[232px]' };
