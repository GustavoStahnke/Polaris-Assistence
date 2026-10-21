import type { IntegrationView } from '@polaris/shared';
import { CheckCircle2, CircleAlert, FlaskConical, Info, Plug, Save, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { Tabs } from '../../components/ui/Tabs';
import { cn } from '../../lib/cn';
import { formatDateTime } from '../../lib/format';
import { useIntegrationAction, useIntegrationLogs, useUpdateIntegration } from './api';
import { SchemaForm } from './SchemaForm';
import { STATUS_META } from './status';
import { EXTRA_PANELS } from './widgets/panels';

type TabId = 'config' | 'guide' | 'logs' | string;

/** Gaveta lateral de uma integração: configuração, guia passo a passo e eventos. */
export function IntegrationDrawer({
  integration,
  onClose,
}: {
  integration: IntegrationView | null;
  onClose: () => void;
}) {
  return (
    <Drawer
      open={integration !== null}
      onClose={onClose}
      label="Integração"
      title={integration?.name ?? ''}
      width="max-w-xl"
    >
      {integration && <DrawerContent key={integration.id} integration={integration} />}
    </Drawer>
  );
}

function DrawerContent({ integration }: { integration: IntegrationView }) {
  const hasForm = Boolean(integration.configSchema);
  const panels = integration.panels.filter((p) => EXTRA_PANELS[p]);
  const tabs = [
    ...(hasForm || panels.length === 0 ? [{ id: 'config', label: 'Configuração' }] : []),
    ...panels.map((p) => ({ id: p, label: EXTRA_PANELS[p]!.title })),
    ...(integration.guide ? [{ id: 'guide', label: 'Guia' }] : []),
    { id: 'logs', label: 'Eventos' },
  ];
  const [tab, setTab] = useState<TabId>(integration.guide && !integration.configured ? 'guide' : tabs[0]!.id);
  const [values, setValues] = useState<Record<string, unknown>>(integration.config);
  const update = useUpdateIntegration();
  const action = useIntegrationAction();
  const status = STATUS_META[integration.status];
  const Panel = EXTRA_PANELS[tab]?.component;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={status.tone}>{status.label}</Badge>
        <Badge tone={integration.free ? 'success' : 'warning'}>
          {integration.free ? 'Gratuito' : 'Pago'}
        </Badge>
        {integration.syncIntervalMinutes && (
          <Badge tone="muted">Sincroniza a cada {integration.syncIntervalMinutes} min</Badge>
        )}
        {integration.account && <Badge tone="muted">{integration.account}</Badge>}
      </div>
      <p className="text-sm text-text-dim">{integration.description}</p>
      {integration.dependsOn.length > 0 && (
        <p className="flex items-center gap-2 text-xs text-text-dim">
          <Info className="h-3.5 w-3.5 text-primary" aria-hidden /> Depende de:{' '}
          {integration.dependsOn.join(', ')}
        </p>
      )}

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === 'config' && (
        <div className="space-y-5">
          {hasForm ? (
            <SchemaForm integration={integration} values={values} onChange={setValues} />
          ) : (
            <p className="text-sm text-text-dim">Esta integração não precisa de configuração: é só ativar.</p>
          )}
          <div className="flex flex-wrap gap-2">
            {hasForm && (
              <Button
                variant="primary"
                icon={Save}
                loading={update.isPending}
                onClick={() => update.mutate({ id: integration.id, config: values })}
              >
                Salvar
              </Button>
            )}
            {integration.canConnect && (
              <Button
                variant={integration.account && integration.status !== 'expirada' ? 'outline' : 'primary'}
                icon={Plug}
                loading={action.isPending && action.variables?.action === 'connect'}
                onClick={() => action.mutate({ id: integration.id, action: 'connect' })}
              >
                {integration.status === 'expirada'
                  ? 'Reconectar'
                  : integration.account
                    ? 'Trocar de conta'
                    : 'Conectar com Google'}
              </Button>
            )}
            <Button
              icon={FlaskConical}
              loading={action.isPending && action.variables?.action === 'test'}
              onClick={() => action.mutate({ id: integration.id, action: 'test' })}
            >
              Testar conexão
            </Button>
          </div>
        </div>
      )}

      {Panel && <Panel integration={integration} />}

      {tab === 'guide' && integration.guide && (
        <div className="space-y-4">
          <p className="font-semibold">{integration.guide.title}</p>
          <ol className="space-y-3">
            {integration.guide.steps.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/60 font-mono text-xs text-primary">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-text-dim [&_code]:rounded [&_code]:bg-primary/10 [&_code]:px-1 [&_code]:font-mono [&_code]:text-star [&_strong]:text-text">
                  <GuideText text={step} />
                </span>
              </li>
            ))}
          </ol>
          {integration.guide.notes?.map((note) => (
            <p
              key={note}
              className="flex gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm text-warning"
            >
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {note}
            </p>
          ))}
        </div>
      )}

      {tab === 'logs' && <LogsList id={integration.id} />}
    </div>
  );
}

/** Mostra **negrito** e `código` dentro dos passos do guia. */
function GuideText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : part.startsWith('`') ? (
          <code key={i}>{part.slice(1, -1)}</code>
        ) : (
          part
        ),
      )}
    </>
  );
}

function LogsList({ id }: { id: string }) {
  const logs = useIntegrationLogs(id);
  if (logs.isPending) return <p className="text-sm text-text-dim">Carregando eventos…</p>;
  if (!logs.data?.length) return <p className="text-sm text-text-dim">Nenhum evento ainda.</p>;
  return (
    <ul className="space-y-2">
      {logs.data.map((log) => {
        const Icon = log.level === 'error' ? XCircle : log.level === 'success' ? CheckCircle2 : Info;
        return (
          <li key={log.id} className="flex gap-3 rounded-lg border border-border/50 p-2.5 text-sm">
            <Icon
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0',
                log.level === 'error'
                  ? 'text-danger'
                  : log.level === 'success'
                    ? 'text-success'
                    : 'text-primary',
              )}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="break-words">{log.message}</p>
              <p className="label-mono mt-0.5 text-[10px] text-text-dim">
                {log.action} · {formatDateTime(log.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
