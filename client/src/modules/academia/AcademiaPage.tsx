import { useSearchParams } from 'react-router';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs } from '../../components/ui/Tabs';
import { BodyTab } from './BodyTab';
import { ExercisesTab } from './ExercisesTab';
import { HistoryTab } from './HistoryTab';
import { ProgressTab } from './ProgressTab';
import { RoutinesTab } from './RoutinesTab';
import { TodayTab } from './TodayTab';

const TABS = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'fichas', label: 'Fichas' },
  { id: 'historico', label: 'Histórico' },
  { id: 'evolucao', label: 'Evolução' },
  { id: 'corpo', label: 'Corpo' },
  { id: 'exercicios', label: 'Exercícios' },
] as const;
type TabId = (typeof TABS)[number]['id'];

export function AcademiaPage() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.id === params.get('aba'))?.id ?? 'hoje') as TabId;

  return (
    <>
      <PageHeader label="Treino · Academia" title="Academia" />
      <Tabs
        tabs={[...TABS]}
        value={tab}
        onChange={(id) => setParams({ aba: id })}
        className="mb-5 w-fit max-w-full"
      />
      {tab === 'hoje' && <TodayTab />}
      {tab === 'fichas' && <RoutinesTab />}
      {tab === 'historico' && <HistoryTab />}
      {tab === 'evolucao' && <ProgressTab />}
      {tab === 'corpo' && <BodyTab />}
      {tab === 'exercicios' && <ExercisesTab />}
    </>
  );
}
