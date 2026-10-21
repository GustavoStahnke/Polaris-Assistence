import { EMAIL_CATEGORY_LABELS } from '@polaris/shared';
import { Mail, Star } from 'lucide-react';
import { Link } from 'react-router';
import { Badge } from '../../components/ui/Badge';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { formatRelative } from '../../lib/format';
import { useEmails } from './api';
import { CATEGORY_TONES } from './categories';
import { integrationsPath } from '../../lib/paths';

/** Card "E-mails importantes" do Painel: quantidade e os 3 principais. */
export function EmailCard({ index, className }: { index?: number; className?: string }) {
  const emails = useEmails();
  const data = emails.data;
  const important = (data?.emails ?? []).filter((e) => e.category !== 'ignorar');
  const notConnected = data?.state === 'not_configured' || data?.state === 'disabled';

  return (
    <PolarisCard
      index={index}
      className={className}
      icon={Mail}
      label="Comunicações · E-mail"
      title={important.length ? `${important.length} importante(s)` : 'Caixa em dia'}
      badge={data?.counts.urgente ? <Badge tone="danger">{data.counts.urgente} urgente(s)</Badge> : undefined}
      state={
        emails.isPending
          ? 'loading'
          : data?.state === 'error' && !important.length
            ? 'error'
            : important.length
              ? 'ready'
              : 'empty'
      }
      emptyTitle={notConnected ? 'Conecte o Gmail' : 'Nenhum e-mail importante'}
      emptyMessage={notConnected ? 'Veja só o que importa, já com triagem.' : 'Tudo tranquilo por aqui.'}
      emptyAction={
        notConnected && (
          <Link to={integrationsPath('google-account')} className="label-mono text-primary hover:text-star">
            Conectar →
          </Link>
        )
      }
      errorMessage={data?.error ?? 'Não foi possível carregar os e-mails.'}
      footer={data?.fetchedAt ? `Gmail · ${formatRelative(data.fetchedAt)}` : 'Gmail'}
      to="/email"
    >
      <ul className="space-y-2.5">
        {important.slice(0, 3).map((email) => (
          <li key={email.id} className="text-sm">
            <a href={email.link} target="_blank" rel="noreferrer" className="group block">
              <div className="flex items-center gap-2">
                {email.isVip && <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-label="VIP" />}
                <span className="truncate font-semibold group-hover:text-star">{email.fromName}</span>
                <Badge tone={CATEGORY_TONES[email.category]} className="ml-auto">
                  {EMAIL_CATEGORY_LABELS[email.category]}
                </Badge>
              </div>
              <p className="truncate text-text-dim">{email.subject}</p>
            </a>
          </li>
        ))}
      </ul>
    </PolarisCard>
  );
}
