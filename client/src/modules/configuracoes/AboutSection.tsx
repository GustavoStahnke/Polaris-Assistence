import type { SystemInfo } from '@polaris/shared';
import { useQuery } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { api } from '../../lib/api';
import { formatBytes, formatDateTime } from '../../lib/format';

export function AboutSection() {
  const info = useQuery({ queryKey: ['system-info'], queryFn: () => api.get<SystemInfo>('/system/info') });
  const data = info.data;

  return (
    <PolarisCard
      icon={Info}
      label="Configurações · Sobre"
      title={data?.app ?? 'Polaris Assistence'}
      state={info.isPending ? 'loading' : info.isError ? 'error' : 'ready'}
      errorMessage="Não foi possível ler as informações do sistema."
    >
      {data && (
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <Item label="Versão" value={data.version} />
          <Item label="Node.js" value={data.nodeVersion} />
          <Item label="Banco (SQLite)" value={`${data.sqliteVersion} · ${data.tables} tabelas`} />
          <Item label="Tamanho do banco" value={formatBytes(data.dbSizeBytes)} />
          <Item label="Backups" value={`${data.backupsCount}`} />
          <Item label="Último backup" value={data.lastBackupAt ? formatDateTime(data.lastBackupAt) : '—'} />
          <Item label="Arquivo do banco" value={data.dbPath} mono wide />
        </dl>
      )}
    </PolarisCard>
  );
}

function Item({
  label,
  value,
  mono,
  wide,
}: {
  label: string;
  value: string;
  mono?: boolean;
  wide?: boolean;
}) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <dt className="label-mono text-text-dim">{label}</dt>
      <dd className={mono ? 'mt-0.5 font-mono text-xs break-all' : 'mt-0.5'}>{value}</dd>
    </div>
  );
}
