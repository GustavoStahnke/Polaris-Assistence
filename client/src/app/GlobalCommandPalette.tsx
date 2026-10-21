import type { SearchResult, SearchResultType } from '@polaris/shared';
import { useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  BookOpen,
  BookOpenCheck,
  Dumbbell,
  ListTodo,
  MessageCircle,
  Play,
  RefreshCw,
  StickyNote,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { CommandPalette, type PaletteCommand } from '../components/ui/CommandPalette';
import { api } from '../lib/api';
import { useBeginWorkout } from '../modules/academia/useBeginWorkout';
import { useTodayWorkout } from '../modules/academia/api';
import { useSyncAll } from '../modules/integracoes/api';
import { useUiStore } from '../stores/uiStore';
import { NAV_ITEMS } from './navigation';

const RESULT_ICONS: Record<SearchResultType, LucideIcon> = {
  nota: StickyNote,
  livro: BookOpen,
  tarefa: ListTodo,
  exercicio: Dumbbell,
  lembrete: Bell,
};
const RESULT_LABELS: Record<SearchResultType, string> = {
  nota: 'Notas',
  livro: 'Livros',
  tarefa: 'Tarefas',
  exercicio: 'Exercícios',
  lembrete: 'Lembretes',
};

/** Paleta Ctrl+K: busca global, ações rápidas e navegação. */
export function GlobalCommandPalette() {
  const navigate = useNavigate();
  const setQuickAction = useUiStore((s) => s.setQuickAction);
  const setChatOpen = useUiStore((s) => s.setChatOpen);
  const today = useTodayWorkout();
  const { begin } = useBeginWorkout();
  const syncAll = useSyncAll();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 200);
    return () => clearTimeout(id);
  }, [query]);

  const search = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => api.get<SearchResult[]>(`/search?q=${encodeURIComponent(debounced)}`),
    enabled: debounced.length >= 2,
  });

  const commands = useMemo<PaletteCommand[]>(() => {
    const active = today.data?.activeSession;
    const planned = today.data?.planned[0];
    const actions: PaletteCommand[] = [
      {
        id: 'act:chat',
        label: 'Falar com a Polaris',
        group: 'Ações rápidas',
        icon: MessageCircle,
        keywords: 'ia chat conversar perguntar canal',
        run: () => setChatOpen(true),
      },
      {
        id: 'act:note',
        label: 'Nova nota',
        group: 'Ações rápidas',
        icon: StickyNote,
        keywords: 'ideia anotar capturar',
        run: () => setQuickAction('note'),
      },
      {
        id: 'act:task',
        label: 'Nova tarefa',
        group: 'Ações rápidas',
        icon: ListTodo,
        keywords: 'todo fazer',
        run: () => setQuickAction('task'),
      },
      {
        id: 'act:reading',
        label: 'Registrar leitura',
        group: 'Ações rápidas',
        icon: BookOpenCheck,
        keywords: 'páginas livro ler',
        run: () => setQuickAction('reading'),
      },
      {
        id: 'act:workout',
        label: active ? 'Continuar treino' : 'Iniciar treino',
        hint: active ? (active.routineName ?? undefined) : (planned?.name ?? 'Treino livre'),
        group: 'Ações rápidas',
        icon: Play,
        keywords: 'academia treinar',
        run: () => (active ? navigate(`/academia/treino/${active.id}`) : void begin(planned?.id ?? null)),
      },
      {
        id: 'act:reminder',
        label: 'Novo lembrete',
        group: 'Ações rápidas',
        icon: Bell,
        keywords: 'avisar alarme',
        run: () => navigate('/tarefas?aba=lembretes'),
      },
      {
        id: 'act:sync',
        label: 'Sincronizar integrações',
        group: 'Ações rápidas',
        icon: RefreshCw,
        keywords: 'atualizar',
        run: () => syncAll.mutate(),
      },
    ];
    const navigation = NAV_ITEMS.map((item) => ({
      id: `nav:${item.path}`,
      label: `Ir para ${item.label}`,
      group: 'Navegação',
      icon: item.icon,
      keywords: item.mobileLabel,
      run: () => navigate(item.path),
    }));
    return [...actions, ...navigation];
  }, [navigate, setQuickAction, setChatOpen, today.data, begin, syncAll]);

  const extra = useMemo<PaletteCommand[]>(
    () =>
      (debounced.length >= 2 ? (search.data ?? []) : []).map((result) => ({
        id: `search:${result.type}:${result.id}`,
        label: result.title,
        hint: result.subtitle ?? undefined,
        group: `Busca · ${RESULT_LABELS[result.type]}`,
        icon: RESULT_ICONS[result.type],
        run: () => navigate(result.to),
      })),
    [search.data, debounced, navigate],
  );

  return <CommandPalette commands={commands} extra={extra} onQueryChange={setQuery} />;
}
