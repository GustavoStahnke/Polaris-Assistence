import { useSearchParams } from 'react-router';
import { PageHeader } from '../../components/ui/PageHeader';
import { Tabs } from '../../components/ui/Tabs';
import { AboutSection } from './AboutSection';
import { AppearanceSection } from './AppearanceSection';
import { BackupSection } from './BackupSection';
import { ProfileSection } from './ProfileSection';

const TABS = [
  { id: 'perfil', label: 'Perfil' },
  { id: 'aparencia', label: 'Aparência' },
  { id: 'backup', label: 'Backup' },
  { id: 'sobre', label: 'Sobre' },
] as const;
type TabId = (typeof TABS)[number]['id'];

export function ConfiguracoesPage() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.id === params.get('aba'))?.id ?? 'perfil') as TabId;

  return (
    <>
      <PageHeader label="Sistema · Ajustes" title="Configurações" />
      <Tabs
        tabs={[...TABS]}
        value={tab}
        onChange={(id) => setParams({ aba: id })}
        className="mb-5 w-fit max-w-full"
      />
      <div className="max-w-4xl">
        {tab === 'perfil' && <ProfileSection />}
        {tab === 'aparencia' && <AppearanceSection />}
        {tab === 'backup' && <BackupSection />}
        {tab === 'sobre' && <AboutSection />}
      </div>
    </>
  );
}
