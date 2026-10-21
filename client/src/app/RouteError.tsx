import { AlertTriangle } from 'lucide-react';
import { Link, useRouteError } from 'react-router';
import { EmptyState } from '../components/ui/EmptyState';

/** Tela mostrada quando uma página quebra (em vez de uma tela branca). */
export function RouteError() {
  const error = useRouteError();
  console.error(error);
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <EmptyState
        icon={AlertTriangle}
        title="Algo saiu da órbita"
        message="Esta tela encontrou um erro inesperado. Tente recarregar a página."
        action={
          <div className="flex gap-3">
            <button className="label-mono text-primary" onClick={() => window.location.reload()}>
              Recarregar
            </button>
            <Link to="/" className="label-mono text-text-dim hover:text-star">
              Voltar ao Painel
            </Link>
          </div>
        }
      />
    </div>
  );
}

export function NotFoundPage() {
  return (
    <EmptyState
      title="Página não encontrada"
      message="Essa rota não existe no mapa estelar do Polaris."
      action={
        <Link to="/" className="label-mono text-primary">
          Voltar ao Painel
        </Link>
      }
    />
  );
}
