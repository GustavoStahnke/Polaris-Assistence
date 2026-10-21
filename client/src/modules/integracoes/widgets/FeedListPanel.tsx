import { NEWS_CATEGORIES_SUGGESTED, type NewsFeed, type NewsFeedValidation } from '@polaris/shared';
import { CheckCircle2, Plus, Rss, Trash2, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Field, Input, Switch } from '../../../components/ui/Input';
import { formatRelative } from '../../../lib/format';
import { useFeedMutations, useFeeds } from '../api';

/** Lista de feeds RSS por categoria, com adicionar, remover, ativar e validar. */
export function FeedListPanel() {
  const feeds = useFeeds();
  const { validate, add, update, remove } = useFeedMutations();
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Brasil');
  const [validation, setValidation] = useState<NewsFeedValidation | null>(null);

  const feedList = feeds.data;
  const grouped = useMemo(() => {
    const groups = new Map<string, NewsFeed[]>();
    for (const feed of feedList ?? [])
      groups.set(feed.category, [...(groups.get(feed.category) ?? []), feed]);
    return [...groups.entries()];
  }, [feedList]);

  const runValidation = async () => {
    const result = await validate.mutateAsync(url.trim());
    setValidation(result);
    if (result.ok && result.title && !title) setTitle(result.title);
  };

  const submit = async () => {
    await add.mutateAsync({
      url: url.trim(),
      title: title.trim() || validation?.title || url,
      category,
      enabled: true,
    });
    setUrl('');
    setTitle('');
    setValidation(null);
  };

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        {grouped.map(([group, items]) => (
          <div key={group}>
            <p className="label-mono mb-2 text-primary">{group}</p>
            <ul className="divide-y divide-border/40 rounded-xl border border-border/60">
              {items.map((feed) => (
                <li key={feed.id} className="flex items-center gap-3 p-3">
                  <Rss className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{feed.title}</p>
                    <p className="truncate font-mono text-[11px] text-text-dim">{feed.url}</p>
                    {feed.lastError ? (
                      <p className="text-xs text-danger">{feed.lastError}</p>
                    ) : (
                      feed.lastFetchedAt && (
                        <p className="text-xs text-text-dim">Lido {formatRelative(feed.lastFetchedAt)}</p>
                      )
                    )}
                  </div>
                  <Switch
                    checked={feed.enabled}
                    onChange={(enabled) => update.mutate({ id: feed.id, enabled })}
                    label={`Ativar ${feed.title}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    icon={Trash2}
                    aria-label={`Remover ${feed.title}`}
                    onClick={() => remove.mutate(feed.id)}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="space-y-3 rounded-xl border border-dashed border-border p-4">
        <p className="label-mono text-text-dim">Adicionar feed</p>
        <Field label="Endereço do feed (URL)">
          {(id) => (
            <Input
              id={id}
              value={url}
              placeholder="https://site.com.br/feed/"
              onChange={(e) => {
                setUrl(e.target.value);
                setValidation(null);
              }}
            />
          )}
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome">
            {(id) => <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} />}
          </Field>
          <Field label="Categoria">
            {(id) => (
              <>
                <Input
                  id={id}
                  list="feed-categories"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
                <datalist id="feed-categories">
                  {NEWS_CATEGORIES_SUGGESTED.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </>
            )}
          </Field>
        </div>
        {validation && (
          <div
            className={`flex items-center gap-2 text-sm ${validation.ok ? 'text-success' : 'text-danger'}`}
          >
            {validation.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {validation.message}
            {validation.title && <Badge tone="muted">{validation.title}</Badge>}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => void runValidation()}
            loading={validate.isPending}
            disabled={!url.trim()}
          >
            Validar
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={Plus}
            onClick={() => void submit()}
            loading={add.isPending}
            disabled={!url.trim() || !category.trim()}
          >
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
}
