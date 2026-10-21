import { Construction } from 'lucide-react';
import { EmptyState } from '../../components/ui/EmptyState';
import { PageHeader } from '../../components/ui/PageHeader';

/** Página provisória de um módulo que ainda vai ser construído. */
export function ComingSoon({ label, title, stage }: { label: string; title: string; stage: number }) {
  return (
    <>
      <PageHeader label={label} title={title} />
      <div className="glass p-6">
        <EmptyState
          icon={Construction}
          title="Módulo em construção"
          message={`A Polaris está montando esta área. Ela chega na Etapa ${stage} do roteiro.`}
        />
      </div>
    </>
  );
}
