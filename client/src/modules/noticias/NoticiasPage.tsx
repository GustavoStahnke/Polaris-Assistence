import type { NewsItemView } from '@polaris/shared';
import {
  Bookmark,
  BookmarkCheck,
  Check,
  ExternalLink,
  Newspaper,
  RefreshCw,
  Rss,
  Search,
  Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Input, Switch } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tabs } from '../../components/ui/Tabs';
import { cn } from '../../lib/cn';
import { formatRelative } from '../../lib/format';
import { useNews, useNewsActions, useSavedNews } from './api';
import { NewsImage } from './NewsImage';

export function NoticiasPage() {
  const [view, setView] = useState<'feed' | 'salvas'>('feed');
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [unread, setUnread] = useState(false);
  const news = useNews({ category, q: debounced, unread });
  const saved = useSavedNews();
  const actions = useNewsActions();

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 350);
    return () => clearTimeout(id);
  }, [query]);

  const data = news.data;
  const items = data?.items ?? [];
  const highlight = items.find((i) => i.imageUrl && !i.read) ?? items[0];
  const rest = items.filter((i) => i !== highlight);

  return (
    <>
      <PageHeader
        label="Radar · Notícias"
        title="Notícias"
        actions={
          <>
            <Link
              to="/integracoes?config=rss"
              className="label-mono flex items-center gap-1.5 text-text-dim hover:text-star"
            >
              <Rss className="h-3.5 w-3.5" /> Feeds
            </Link>
            <Button
              icon={RefreshCw}
              loading={actions.reload.isPending}
              onClick={() => actions.reload.mutate()}
            >
              Atualizar
            </Button>
          </>
        }
      />

      <Tabs
        className="mb-4 w-fit"
        value={view}
        onChange={setView}
        tabs={[
          { id: 'feed', label: 'Radar' },
          { id: 'salvas', label: 'Ler depois', count: saved.data?.length },
        ]}
      />

      {view === 'salvas' ? (
        <SavedList />
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-1.5">
              {['', ...(data?.categories ?? [])].map((c) => (
                <Button
                  key={c || 'todas'}
                  variant="pill"
                  active={category === c}
                  onClick={() => setCategory(c)}
                >
                  {c || 'Todas'}
                </Button>
              ))}
            </div>
            <div className="relative min-w-56 flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-dim"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrar por palavra-chave…"
                className="pl-9"
                aria-label="Filtrar notícias"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-text-dim">
              <Switch checked={unread} onChange={setUnread} label="Só não lidas" /> Só não lidas
            </label>
          </div>

          {data && data.state !== 'ok' && data.error && (
            <p className="mb-4 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
              {data.state === 'stale' ? `Mostrando notícias salvas no cache. ${data.error}` : data.error}{' '}
              <Link to="/integracoes?config=rss" className="underline">
                Ver integração
              </Link>
            </p>
          )}

          {news.isPending ? (
            <div className="space-y-4">
              <Skeleton className="h-64" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : items.length === 0 ? (
            <div className="glass">
              <EmptyState
                icon={Newspaper}
                title="Nada no radar"
                message="Nenhuma notícia com esse filtro. Tente outra palavra ou categoria."
              />
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
              {highlight && <Highlight item={highlight} />}
              <ul className="space-y-3 xl:col-span-1">
                {rest.slice(0, 80).map((item, i) => (
                  <NewsRow key={item.id} item={item} index={i} />
                ))}
              </ul>
            </div>
          )}
          {data?.fetchedAt && (
            <p className="label-mono mt-6 text-center text-[10px] text-text-dim">
              Atualizado {formatRelative(data.fetchedAt)}
            </p>
          )}
        </>
      )}
    </>
  );
}

function useOpenArticle() {
  const { markRead } = useNewsActions();
  return (item: NewsItemView) => {
    if (!item.read) markRead.mutate({ link: item.link, read: true });
  };
}

function Highlight({ item }: { item: NewsItemView }) {
  const open = useOpenArticle();
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass self-start overflow-hidden"
    >
      <a href={item.link} target="_blank" rel="noreferrer" onClick={() => open(item)} className="group block">
        <NewsImage src={item.imageUrl} className="aspect-video w-full" />
        <div className="p-5">
          <div className="flex items-center gap-2">
            <Badge tone="star">Destaque</Badge>
            <span className="label-mono text-[10px] text-text-dim">
              {item.source} · {item.publishedAt ? formatRelative(item.publishedAt) : ''}
            </span>
          </div>
          <h2 className="mt-2 text-xl font-semibold group-hover:text-star">{item.title}</h2>
          {item.summary && <p className="mt-2 line-clamp-4 text-sm text-text-dim">{item.summary}</p>}
        </div>
      </a>
      <div className="px-5 pb-5">
        <ItemActions item={item} />
      </div>
    </motion.article>
  );
}

function NewsRow({ item, index }: { item: NewsItemView; index: number }) {
  const open = useOpenArticle();
  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 10) * 0.03 }}
      className={cn('glass flex gap-3 p-3', item.read && 'opacity-60')}
    >
      <NewsImage src={item.imageUrl} className="h-20 w-24 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        <p className="label-mono text-[10px] text-text-dim">
          {item.source} · {item.category}
          {item.publishedAt && ` · ${formatRelative(item.publishedAt)}`}
        </p>
        <a
          href={item.link}
          target="_blank"
          rel="noreferrer"
          onClick={() => open(item)}
          className="mt-0.5 line-clamp-2 font-medium hover:text-star"
        >
          {item.title}
        </a>
        <ItemActions item={item} compact />
      </div>
    </motion.li>
  );
}

function ItemActions({ item, compact }: { item: NewsItemView; compact?: boolean }) {
  const { markRead, save } = useNewsActions();
  return (
    <div className={cn('flex flex-wrap gap-1', compact ? 'mt-1' : 'mt-1')}>
      <Button
        size="sm"
        variant="ghost"
        icon={item.saved ? BookmarkCheck : Bookmark}
        disabled={item.saved}
        onClick={() => save.mutate(item)}
        className="h-7 px-2 text-xs"
      >
        {item.saved ? 'Salva' : 'Ler depois'}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        icon={Check}
        onClick={() => markRead.mutate({ link: item.link, read: !item.read })}
        className="h-7 px-2 text-xs"
      >
        {item.read ? 'Marcar como não lida' : 'Marcar como lida'}
      </Button>
    </div>
  );
}

function SavedList() {
  const saved = useSavedNews();
  const { unsave, markRead } = useNewsActions();
  if (saved.data?.length === 0) {
    return (
      <div className="glass">
        <EmptyState
          icon={Bookmark}
          title="Nada salvo ainda"
          message="Use “Ler depois” nas notícias que quiser guardar."
        />
      </div>
    );
  }
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {saved.data?.map((a) => (
        <li key={a.id} className="glass flex gap-3 p-3">
          <NewsImage src={a.imageUrl} className="h-20 w-24 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1">
            <p className="label-mono text-[10px] text-text-dim">
              {a.source} · salva {formatRelative(a.createdAt)}
            </p>
            <a
              href={a.link}
              target="_blank"
              rel="noreferrer"
              onClick={() => markRead.mutate({ link: a.link, read: true })}
              className="mt-0.5 line-clamp-2 font-medium hover:text-star"
            >
              {a.title} <ExternalLink className="inline h-3 w-3" aria-hidden />
            </a>
            <Button
              size="sm"
              variant="ghost"
              icon={Trash2}
              className="mt-1 h-7 px-2 text-xs"
              onClick={() => unsave.mutate(a.id)}
            >
              Remover
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
