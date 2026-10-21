import { INTEGRATION_CATEGORY_LABELS, type IntegrationCategory, type IntegrationView } from '@polaris/shared';
import { RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tabs } from '../../components/ui/Tabs';
import { toast } from '../../stores/toastStore';
import { useIntegrations, useSyncAll } from './api';
import { IntegrationCard } from './IntegrationCard';
import { IntegrationDrawer } from './IntegrationDrawer';

type Filter = 'todas' | 'conectadas' | 'disponiveis' | 'em_breve';

const FILTERS: Record<Filter, (i: IntegrationView) => boolean> = {
  todas: () => true,
  conectadas: (i) => i.status === 'conectada',
  disponiveis: (i) => i.availability === 'available',
  em_breve: (i) => i.availability === 'soon',
};

/** Aba Integrações da página Configurações: a central de conexões do sistema. */
export function IntegrationsSection() {
  const integrations = useIntegrations();
  const syncAll = useSyncAll();
  const [filter, setFilter] = useState<Filter>('todas');
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('config');
  const list = useMemo(() => integrations.data ?? [], [integrations.data]);
  const selected = list.find((i) => i.id === selectedId) ?? null;

  const counts = {
    connected: list.filter((i) => i.status === 'conectada').length,
    errors: list.filter((i) => i.status === 'erro' || i.status === 'expirada').length,
    soon: list.filter((i) => i.availability === 'soon').length,
    available: list.filter((i) => i.availability === 'available').length,
  };

  const grouped = useMemo(() => {
    const groups = new Map<IntegrationCategory, IntegrationView[]>();
    for (const item of list.filter(FILTERS[filter])) {
      groups.set(item.category, [...(groups.get(item.category) ?? []), item]);
    }
    return [...groups.entries()];
  }, [list, filter]);

  // Abre ou fecha a gaveta mantendo os outros parâmetros da URL (como a aba atual).
  const openConfig = (id: string | null) =>
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (id) next.set('config', id);
      else next.delete('config');
      return next;
    });

  // Volta do login do Google: mostra o resultado uma vez e limpa a URL.
  const googleResult = params.get('google');
  const googleMessage = params.get('mensagem');
  useEffect(() => {
    if (!googleResult) return;
    if (googleResult === 'ok') toast.success('Conta Google conectada', googleMessage ?? undefined);
    else toast.error('Não foi possível conectar ao Google', googleMessage ?? undefined);
    setParams({ aba: 'integracoes', config: 'google-account' }, { replace: true });
  }, [googleResult, googleMessage, setParams]);
  let cardIndex = 0;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="label-mono text-text-dim">
          <span className="text-success">{counts.connected} conectadas</span> ·{' '}
          <span className={counts.errors ? 'text-danger' : undefined}>{counts.errors} com erro</span> ·{' '}
          {counts.soon} em breve
        </p>
        <Button
          variant="primary"
          icon={RefreshCw}
          loading={syncAll.isPending}
          onClick={() => syncAll.mutate()}
        >
          Sincronizar tudo
        </Button>
      </div>

      {integrations.isPending ? (
        <Skeleton className="h-72 w-full" />
      ) : integrations.isError ? (
        <EmptyState
          title="Não foi possível carregar as integrações"
          message="Verifique se o servidor está rodando."
        />
      ) : (
        <>
          <Tabs
            className="mb-6 w-fit max-w-full"
            value={filter}
            onChange={setFilter}
            tabs={[
              { id: 'todas', label: 'Todas', count: list.length },
              { id: 'conectadas', label: 'Conectadas', count: counts.connected },
              { id: 'disponiveis', label: 'Disponíveis', count: counts.available },
              { id: 'em_breve', label: 'Em breve', count: counts.soon },
            ]}
          />

          {grouped.length === 0 && (
            <EmptyState title="Nada neste filtro" message="Tente outro filtro acima." />
          )}

          {/* Cada categoria ocupa a largura toda; os cards ficam lado a lado,
              com a mesma largura e a mesma altura em cada linha. */}
          <div className="space-y-6">
            {grouped.map(([category, items]) => (
              <section key={category}>
                <h2 className="label-mono mb-3 text-primary">{INTEGRATION_CATEGORY_LABELS[category]}</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((integration) => (
                    <IntegrationCard
                      key={integration.id}
                      integration={integration}
                      index={cardIndex++}
                      onConfigure={() => openConfig(integration.id)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      <IntegrationDrawer integration={selected} onClose={() => openConfig(null)} />
    </>
  );
}
