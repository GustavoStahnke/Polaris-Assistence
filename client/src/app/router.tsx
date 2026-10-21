import { createBrowserRouter } from 'react-router';
import { PainelPage } from '../modules/painel/PainelPage';
import { BootScreen } from './BootScreen';
import { Layout } from './Layout';
import { NotFoundPage, RouteError } from './RouteError';

// Cada módulo é carregado só quando o usuário abre a página (deixa o app mais leve).
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <RouteError />,
    HydrateFallback: BootScreen,
    children: [
      { index: true, element: <PainelPage /> },
      {
        path: 'agenda',
        lazy: async () => ({ Component: (await import('../modules/agenda/AgendaPage')).AgendaPage }),
      },
      {
        path: 'email',
        lazy: async () => ({ Component: (await import('../modules/email/EmailPage')).EmailPage }),
      },
      {
        path: 'noticias',
        lazy: async () => ({ Component: (await import('../modules/noticias/NoticiasPage')).NoticiasPage }),
      },
      {
        path: 'clima',
        lazy: async () => ({ Component: (await import('../modules/clima/ClimaPage')).ClimaPage }),
      },
      {
        path: 'biblioteca/*',
        lazy: async () => ({
          Component: (await import('../modules/biblioteca/BibliotecaPage')).BibliotecaPage,
        }),
      },
      {
        path: 'academia/*',
        lazy: async () => ({ Component: (await import('../modules/academia/AcademiaPage')).AcademiaPage }),
      },
      {
        path: 'notas',
        lazy: async () => ({ Component: (await import('../modules/notas/NotasPage')).NotasPage }),
      },
      {
        path: 'tarefas',
        lazy: async () => ({ Component: (await import('../modules/tarefas/TarefasPage')).TarefasPage }),
      },
      {
        path: 'habitos',
        lazy: async () => ({ Component: (await import('../modules/habitos/HabitosPage')).HabitosPage }),
      },
      {
        path: 'integracoes',
        lazy: async () => ({
          Component: (await import('../modules/integracoes/IntegracoesPage')).IntegracoesPage,
        }),
      },
      {
        path: 'configuracoes',
        lazy: async () => ({
          Component: (await import('../modules/configuracoes/ConfiguracoesPage')).ConfiguracoesPage,
        }),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
