import { Plus, RefreshCw, Sparkles, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { PolarisCard } from '../../components/ui/PolarisCard';
import {
  useAddRecommendation,
  useDismissRecommendation,
  useRecommendations,
  useRefreshRecommendations,
} from './api';
import { BookCover } from './BookCover';

export function RecommendationsTab() {
  const recs = useRecommendations();
  const refresh = useRefreshRecommendations();
  const add = useAddRecommendation();
  const dismiss = useDismissRecommendation();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-text-dim">
          Sugestões a partir dos assuntos dos livros que você avaliou com 4 ou 5 estrelas, sem repetir o que
          já está na estante. Com a IA conectada, cada sugestão também explica o porquê.
        </p>
        <Button
          variant="primary"
          icon={RefreshCw}
          loading={refresh.isPending}
          onClick={() => refresh.mutate()}
        >
          Buscar sugestões
        </Button>
      </div>
      {recs.data?.length === 0 ? (
        <div className="glass">
          <EmptyState
            icon={Sparkles}
            title="Nenhuma sugestão ainda"
            message="Avalie alguns livros lidos e clique em Buscar sugestões."
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recs.data?.map((rec, i) => (
            <PolarisCard key={rec.id} index={i} label="Biblioteca · Sugestão" title={rec.title}>
              <div className="flex gap-4">
                <BookCover
                  url={rec.coverUrl?.replace('-L.jpg', '-M.jpg') ?? null}
                  title={rec.title}
                  className="w-20 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-text-dim">{rec.authors.join(', ')}</p>
                  <p className="text-xs text-text-dim">
                    {[rec.publishYear, rec.pageCount && `${rec.pageCount} páginas`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {rec.reason && (
                    <p className="mt-2 flex gap-1.5 text-sm text-text">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />{' '}
                      {rec.reason}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  icon={Plus}
                  loading={add.isPending && add.variables === rec.id}
                  onClick={() => add.mutate(rec.id)}
                >
                  Adicionar à estante
                </Button>
                <Button size="sm" variant="ghost" icon={X} onClick={() => dismiss.mutate(rec.id)}>
                  Dispensar
                </Button>
              </div>
            </PolarisCard>
          ))}
        </div>
      )}
    </div>
  );
}
