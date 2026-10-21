import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs } from '../../components/ui/Tabs';
import { AddBookModal } from './AddBookModal';
import { RecommendationsTab } from './RecommendationsTab';
import { ShelfTab } from './ShelfTab';
import { StatsTab } from './StatsTab';

const TABS = [
  { id: 'estante', label: 'Estante' },
  { id: 'recomendacoes', label: 'Recomendações' },
  { id: 'estatisticas', label: 'Estatísticas' },
] as const;
type TabId = (typeof TABS)[number]['id'];

export function BibliotecaPage() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.id === params.get('aba'))?.id ?? 'estante') as TabId;
  const [adding, setAdding] = useState(false);

  return (
    <>
      <PageHeader
        label="Biblioteca · Leitura"
        title="Biblioteca"
        actions={
          <Button variant="primary" icon={Plus} onClick={() => setAdding(true)}>
            Adicionar livro
          </Button>
        }
      />
      <Tabs
        tabs={[...TABS]}
        value={tab}
        onChange={(id) => setParams({ aba: id })}
        className="mb-5 w-fit max-w-full"
      />
      {tab === 'estante' && <ShelfTab onAdd={() => setAdding(true)} />}
      {tab === 'recomendacoes' && <RecommendationsTab />}
      {tab === 'estatisticas' && <StatsTab />}
      <AddBookModal open={adding} onClose={() => setAdding(false)} />
    </>
  );
}
