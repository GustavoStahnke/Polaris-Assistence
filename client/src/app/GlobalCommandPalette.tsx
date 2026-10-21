import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { CommandPalette, type PaletteCommand } from '../components/ui/CommandPalette';
import { NAV_ITEMS } from './navigation';

/** Paleta Ctrl+K do sistema: navegação entre módulos (busca global e ações chegam na Etapa 7). */
export function GlobalCommandPalette() {
  const navigate = useNavigate();

  const commands = useMemo<PaletteCommand[]>(
    () =>
      NAV_ITEMS.map((item) => ({
        id: `nav:${item.path}`,
        label: `Ir para ${item.label}`,
        group: 'Navegação',
        icon: item.icon,
        keywords: item.mobileLabel,
        run: () => navigate(item.path),
      })),
    [navigate],
  );

  return <CommandPalette commands={commands} />;
}
