import { INTEGRATION_CATEGORY_LABELS, type IntegrationCategory, type IntegrationView } from '@polaris/shared';
import { RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tabs } from '../../components/ui/Tabs';
import { useIntegrations, useSyncAll } from './api';
import { ConnectionMap } from './ConnectionMap';
import { IntegrationCard } from './IntegrationCard';
import { IntegrationDrawer } from './IntegrationDrawer';

type Filter = 'todas' | 'conectadas' | 'disponiveis' | 'em_breve';

const FILTERS: Record<Filter, (i: IntegrationView) => boolean> = {
  todas: () => true,
  conectadas: (i) => i.status === 'conectada',
  disponiveis: (i) => i.availability === 'available',
  em_breve: (i) => i.availability === 'soon',
};

export function IntegracoesPage() {
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

  const openConfig = (id: string | null) => setParams(id ? { config: id } : {});
  let cardIndex = 0;

  return (
    <>
      <PageHeader
        label="Sistema · Conexões"
        title="Integrações"
        actions={
          <Button
            variant="primary"
            icon={RefreshCw}
            loading={syncAll.isPending}
            onClick={() => syncAll.mutate()}
          >
            Sincronizar tudo
          </Button>
        }
      />

      <p className="label-mono -mt-3 mb-5 text-text-dim">
        <span className="text-success">{counts.connected} conectadas</span> ·{' '}
        <span className={counts.errors ? 'text-danger' : undefined}>{counts.errors} com erro</span> ·{' '}
        {counts.soon} em breve
      </p>

      {integrations.isPending ? (
        <Skeleton className="h-72 w-full" />
      ) : integrations.isError ? (
        <EmptyState
          title="Não foi possível carregar as integrações"
          message="Verifique se o servidor está rodando."
        />
      ) : (
        <>
          <ConnectionMap integrations={list} />

          <Tabs
            className="my-6 w-fit max-w-full"
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

          {/* Grupos por categoria em colunas, para não sobrar espaço vazio. */}
          <div className="gap-5 md:columns-2 xl:columns-3">
            {grouped.map(([category, items]) => (
              <section key={category} className="mb-6 break-inside-avoid">
                <h2 className="label-mono mb-3 text-primary">{INTEGRATION_CATEGORY_LABELS[category]}</h2>
                <div className="grid grid-cols-1 gap-4">
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
