import { Newspaper } from 'lucide-react';
import { Link } from 'react-router';
import { Badge } from '../../components/ui/Badge';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { formatRelative } from '../../lib/format';
import { useNews } from './api';
import { NewsImage } from './NewsImage';

/** Card "Radar de notícias" do Painel: um destaque com imagem e uma lista curta. */
export function NewsCard({ index, className }: { index?: number; className?: string }) {
  const news = useNews({ unread: true });
  const data = news.data;
  const items = data?.items ?? [];
  const highlight = items.find((i) => i.imageUrl) ?? items[0];
  const others = items.filter((i) => i !== highlight).slice(0, 3);

  const state = news.isPending
    ? 'loading'
    : items.length
      ? 'ready'
      : data?.state === 'error'
        ? 'error'
        : 'empty';

  return (
    <PolarisCard
      index={index}
      className={className}
      icon={Newspaper}
      label="Radar · Notícias"
      title="Destaques"
      badge={data?.state === 'stale' ? <Badge tone="warning">Cache</Badge> : <Badge>Agora</Badge>}
      state={state}
      emptyTitle="Tudo lido por aqui"
      emptyMessage="Você está em dia com as notícias. A Polaris avisa quando chegarem novas."
      errorMessage={data?.error ?? 'Não foi possível carregar as notícias.'}
      footer={data?.fetchedAt ? `RSS · ${formatRelative(data.fetchedAt)}` : 'RSS'}
      to="/noticias"
    >
      {highlight && (
        <div className="space-y-3">
          <a href={highlight.link} target="_blank" rel="noreferrer" className="group flex gap-3">
            <NewsImage src={highlight.imageUrl} className="h-16 w-24 shrink-0 rounded-lg" />
            <div className="min-w-0">
              <p className="label-mono text-[10px] text-text-dim">{highlight.source}</p>
              <p className="line-clamp-2 text-sm font-semibold group-hover:text-star">{highlight.title}</p>
            </div>
          </a>
          <ul className="space-y-1.5 border-t border-border/40 pt-3">
            {others.map((item) => (
              <li key={item.id} className="truncate text-sm">
                <a href={item.link} target="_blank" rel="noreferrer" className="hover:text-star">
                  <span className="text-primary">›</span> {item.title}
                </a>
              </li>
            ))}
          </ul>
          <Link to="/noticias" className="sr-only">
            Ver todas as notícias
          </Link>
        </div>
      )}
    </PolarisCard>
  );
}
