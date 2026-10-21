import { isStrengthModality, modalityIdSchema } from '@polaris/shared';
import { useSearchParams } from 'react-router';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs } from '../../components/ui/Tabs';
import { ActivityLogModal } from './ActivityLogModal';
import { BodyTab } from './BodyTab';
import { ExercisesTab } from './ExercisesTab';
import { HistoryTab } from './HistoryTab';
import { ModalitiesTab } from './ModalitiesTab';
import { ProgressTab } from './ProgressTab';
import { RoutinesTab } from './RoutinesTab';
import { TodayTab } from './TodayTab';

const TABS = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'fichas', label: 'Planos' },
  { id: 'historico', label: 'Histórico' },
  { id: 'evolucao', label: 'Evolução' },
  { id: 'corpo', label: 'Corpo' },
  { id: 'exercicios', label: 'Exercícios' },
  { id: 'modalidades', label: 'Modalidades' },
] as const;
type TabId = (typeof TABS)[number]['id'];

export function AcademiaPage() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.id === params.get('aba'))?.id ?? 'hoje') as TabId;

  // "?registrar=corrida" (vindo da paleta Ctrl+K) já abre o registro daquela modalidade.
  const toLog = modalityIdSchema.safeParse(params.get('registrar'));
  const logModality = toLog.success && !isStrengthModality(toLog.data) ? toLog.data : null;
  const closeLog = () =>
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('registrar');
      return next;
    });

  return (
    <>
      <PageHeader label="Treino · Modalidades" title="Treino" />
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
      {tab === 'modalidades' && <ModalitiesTab />}
      <ActivityLogModal target={logModality ? { modality: logModality } : null} onClose={closeLog} />
    </>
  );
}
