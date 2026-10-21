import { EMAIL_CATEGORIES, EMAIL_CATEGORY_LABELS, type EmailCategory } from '@polaris/shared';
import { ExternalLink, Inbox, Mail, RefreshCw, Sparkles, Star } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Select } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tabs } from '../../components/ui/Tabs';
import { cn } from '../../lib/cn';
import { formatRelative } from '../../lib/format';
import { useEmailActions, useEmails } from './api';
import { CATEGORY_TONES } from './categories';

export function EmailPage() {
  const emails = useEmails();
  const { refresh, triage } = useEmailActions();
  const [filter, setFilter] = useState<'todos' | EmailCategory>('todos');
  const data = emails.data;
  const list = (data?.emails ?? []).filter((e) => filter === 'todos' || e.category === filter);
  const notConnected = data?.state === 'not_configured' || data?.state === 'disabled';

  return (
    <>
      <PageHeader
        label="Comunicações · E-mail"
        title="E-mail"
        actions={
          <>
            <Link to="/integracoes?config=gmail" className="label-mono text-text-dim hover:text-star">
              Filtros e VIPs
            </Link>
            <Button
              icon={RefreshCw}
              loading={refresh.isPending}
              onClick={() => refresh.mutate()}
              disabled={notConnected}
            >
              Atualizar
            </Button>
          </>
        }
      />

      {notConnected ? (
        <div className="glass">
          <EmptyState
            icon={Mail}
            title="Conecte seu Gmail"
            message="A Polaris mostra só os e-mails que importam e já separa o que é urgente. Somente leitura."
            action={
              <Link
                to="/integracoes?config=google-account"
                className="label-mono text-primary hover:text-star"
              >
                Conectar Conta Google →
              </Link>
            }
          />
        </div>
      ) : (
        <>
          {data && (data.state === 'error' || data.state === 'stale') && data.error && (
            <p className="mb-4 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
              {data.state === 'stale' ? 'Mostrando a última lista salva. ' : ''}
              {data.error}{' '}
              <Link to="/integracoes?config=gmail" className="underline">
                Ver integração
              </Link>
            </p>
          )}
          <Tabs
            className="mb-5 w-fit max-w-full"
            value={filter}
            onChange={setFilter}
            tabs={[
              { id: 'todos', label: 'Todos', count: data?.emails.length ?? 0 },
              ...EMAIL_CATEGORIES.map((c) => ({
                id: c,
                label: EMAIL_CATEGORY_LABELS[c],
                count: data?.counts[c] ?? 0,
              })),
            ]}
          />
          {emails.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : list.length === 0 ? (
            <div className="glass">
              <EmptyState
                icon={Inbox}
                title="Caixa em dia"
                message="Nenhum e-mail importante aqui. Respire fundo. ✨"
              />
            </div>
          ) : (
            <ul className="space-y-2">
              {list.map((email) => (
                <li
                  key={email.id}
                  className={cn('glass flex flex-wrap items-start gap-3 p-4', !email.unread && 'opacity-70')}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {email.isVip && <Star className="h-4 w-4 fill-warning text-warning" aria-label="VIP" />}
                      <span className="font-semibold">{email.fromName}</span>
                      <span className="truncate font-mono text-xs text-text-dim">{email.fromEmail}</span>
                      <span className="label-mono ml-auto text-[10px] text-text-dim">
                        {formatRelative(email.date)}
                      </span>
                    </div>
                    <p className={cn('mt-1', email.unread && 'font-medium')}>{email.subject}</p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-text-dim">{email.snippet}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge tone={CATEGORY_TONES[email.category]}>
                        {EMAIL_CATEGORY_LABELS[email.category]}
                      </Badge>
                      {email.reason && (
                        <span className="flex items-center gap-1 text-xs text-text-dim">
                          {email.triageSource === 'ia' && (
                            <Sparkles className="h-3 w-3 text-primary" aria-hidden />
                          )}
                          {email.reason}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Select
                      value={email.category}
                      onChange={(e) =>
                        triage.mutate({ id: email.id, category: e.target.value as EmailCategory })
                      }
                      aria-label="Corrigir classificação"
                      className="h-8 w-auto text-xs"
                    >
                      {EMAIL_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {EMAIL_CATEGORY_LABELS[c]}
                        </option>
                      ))}
                    </Select>
                    <a
                      href={email.link}
                      target="_blank"
                      rel="noreferrer"
                      className="label-mono inline-flex items-center gap-1 text-[10px] text-primary hover:text-star"
                    >
                      Abrir no Gmail <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {data?.fetchedAt && (
            <p className="label-mono mt-6 text-center text-[10px] text-text-dim">
              Gmail · {formatRelative(data.fetchedAt)}
            </p>
          )}
        </>
      )}
    </>
  );
}
