import { INTEGRATION_CATEGORY_LABELS, type IntegrationView } from '@polaris/shared';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, FlaskConical, Loader2, Plug, RefreshCw, Settings2, Unplug } from 'lucide-react';
import { motion } from 'motion/react';
import { Badge } from '../../components/ui/Badge';
import { DynamicIcon } from '../../components/ui/DynamicIcon';
import { Switch } from '../../components/ui/Input';
import { cn } from '../../lib/cn';
import { formatRelative } from '../../lib/format';
import { useIntegrationAction, useUpdateIntegration } from './api';
import { STATUS_META } from './status';

export function IntegrationCard({
  integration,
  index,
  onConfigure,
}: {
  integration: IntegrationView;
  index: number;
  onConfigure: () => void;
}) {
  const update = useUpdateIntegration();
  const action = useIntegrationAction();
  const status = STATUS_META[integration.status];
  const soon = integration.availability === 'soon';
  const busy = (name: string) =>
    action.isPending && action.variables?.id === integration.id && action.variables.action === name;
  const run = (name: 'test' | 'sync' | 'connect' | 'disconnect') =>
    action.mutate({ id: integration.id, action: name });

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className={cn(
        'glass group relative flex flex-col p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50',
        soon && 'opacity-70',
        integration.status === 'erro' && 'border-danger/50',
        integration.status === 'expirada' && 'border-warning/50',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border bg-primary/10',
            integration.status === 'conectada'
              ? 'glow-box border-primary/60 text-star'
              : 'border-border text-primary',
          )}
        >
          <DynamicIcon name={integration.icon} className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="label-mono text-text-dim">{INTEGRATION_CATEGORY_LABELS[integration.category]}</p>
          <h3 className="truncate text-base font-semibold">{integration.name}</h3>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      <p className="mt-3 flex-1 text-sm text-text-dim">{integration.description}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge tone={integration.free ? 'success' : 'warning'}>
          {integration.free ? 'Gratuito' : 'Pago'}
        </Badge>
        {integration.account && <Badge tone="muted">{integration.account}</Badge>}
        {!soon && (
          <span className="label-mono text-[10px] text-text-dim">
            {integration.lastSyncAt
              ? `Sincronizado ${formatRelative(integration.lastSyncAt)}`
              : integration.lastSuccessAt
                ? `Atualizado ${formatRelative(integration.lastSuccessAt)}`
                : 'Ainda não sincronizado'}
          </span>
        )}
      </div>

      {integration.lastError && (integration.status === 'erro' || integration.status === 'expirada') && (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 p-2.5 text-xs text-danger">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {integration.status === 'expirada'
            ? 'O acesso expirou. Clique em Reconectar para renovar.'
            : integration.lastError}
        </p>
      )}

      {!soon && (
        <div className="mt-4 flex items-center gap-3 border-t border-border/50 pt-4">
          <Switch
            checked={integration.enabled}
            onChange={(enabled) => update.mutate({ id: integration.id, enabled })}
            label={integration.enabled ? `Desativar ${integration.name}` : `Ativar ${integration.name}`}
            disabled={update.isPending}
          />
          <div className="ml-auto flex min-w-0 flex-1 justify-end gap-0.5">
            <CardAction icon={Settings2} label="Configurar" onClick={onConfigure} />
            {integration.status === 'expirada' || (integration.canConnect && !integration.account) ? (
              <CardAction
                icon={Plug}
                label={integration.status === 'expirada' ? 'Reconectar' : 'Conectar'}
                highlight
                loading={busy('connect')}
                onClick={() => run('connect')}
              />
            ) : (
              <CardAction
                icon={FlaskConical}
                label="Testar"
                loading={busy('test')}
                onClick={() => run('test')}
              />
            )}
            {integration.canSync && (
              <CardAction
                icon={RefreshCw}
                label="Sincronizar"
                loading={busy('sync')}
                onClick={() => run('sync')}
                disabled={!integration.enabled || !integration.configured}
              />
            )}
            <CardAction
              icon={Unplug}
              label="Desconectar"
              loading={busy('disconnect')}
              onClick={() => run('disconnect')}
              disabled={!integration.account && !integration.enabled}
            />
          </div>
        </div>
      )}
    </motion.article>
  );
}

/** Botão compacto do card: ícone com o nome embaixo. */
function CardAction({
  icon: Icon,
  label,
  onClick,
  loading,
  disabled,
  highlight,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled || loading}
      className={cn(
        'flex min-w-0 max-w-[76px] flex-1 flex-col items-center gap-1 rounded-lg px-0.5 py-1.5 font-mono text-[9px] tracking-[0.04em] uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-40',
        highlight ? 'bg-primary/15 text-star' : 'text-text-dim hover:bg-primary/10 hover:text-star',
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Icon className="h-4 w-4" aria-hidden />
      )}
      <span className="max-w-full truncate">{label}</span>
    </button>
  );
}
