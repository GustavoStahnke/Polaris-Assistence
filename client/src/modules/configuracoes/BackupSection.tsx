import type { BackupInfo } from '@polaris/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DatabaseBackup, Download, FileJson, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Badge, type BadgeTone } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { api, errorMessage } from '../../lib/api';
import { formatBytes, formatDateTime } from '../../lib/format';
import { toast } from '../../stores/toastStore';

const KIND_LABEL: Record<BackupInfo['kind'], { label: string; tone: BadgeTone }> = {
  manual: { label: 'Manual', tone: 'primary' },
  auto: { label: 'Automático', tone: 'success' },
  'pre-migracao': { label: 'Antes de migração', tone: 'warning' },
  'pre-importacao': { label: 'Antes de importar', tone: 'warning' },
  outro: { label: 'Outro', tone: 'muted' },
};

export function BackupSection() {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<{ name: string; data: unknown } | null>(null);

  const backups = useQuery({ queryKey: ['backups'], queryFn: () => api.get<BackupInfo[]>('/backups') });

  const createBackup = useMutation({
    mutationFn: () => api.post<BackupInfo>('/backups'),
    onSuccess: (backup) => {
      toast.success('Backup criado', backup.fileName);
      void queryClient.invalidateQueries({ queryKey: ['backups'] });
      void queryClient.invalidateQueries({ queryKey: ['system-info'] });
    },
    onError: (error) => toast.error('Falha no backup', errorMessage(error)),
  });

  const importData = useMutation({
    mutationFn: (data: unknown) =>
      api.post<{ inserted: number; backupFile: string }>('/backups/import', data),
    onSuccess: (result) => {
      toast.success(
        'Dados importados',
        `${result.inserted} registros. Backup anterior: ${result.backupFile}`,
      );
      setPendingImport(null);
      void queryClient.invalidateQueries();
    },
    onError: (error) => toast.error('Falha ao importar', errorMessage(error)),
  });

  const onFileChosen = async (file: File | undefined) => {
    if (!file) return;
    try {
      setPendingImport({ name: file.name, data: JSON.parse(await file.text()) });
    } catch {
      toast.error('Arquivo inválido', 'Escolha um arquivo .json exportado pelo Polaris.');
    }
    if (fileInput.current) fileInput.current.value = '';
  };

  return (
    <PolarisCard icon={DatabaseBackup} label="Configurações · Backup" title="Seus dados em segurança">
      <p className="text-sm text-text-dim">
        Todo dia, no primeiro uso, a Polaris faz um backup automático do banco e guarda os últimos 14. Antes
        de qualquer migração ou importação, ela também faz uma cópia.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="primary"
          icon={DatabaseBackup}
          loading={createBackup.isPending}
          onClick={() => createBackup.mutate()}
        >
          Fazer backup agora
        </Button>
        <a
          href="/api/backups/export"
          download
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm transition-colors hover:border-primary/70 hover:text-star"
        >
          <FileJson className="h-4 w-4" aria-hidden /> Exportar tudo (JSON)
        </a>
        <Button icon={Upload} onClick={() => fileInput.current?.click()}>
          Importar JSON
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => void onFileChosen(e.target.files?.[0])}
        />
      </div>

      <div className="mt-5">
        <p className="label-mono mb-2 text-text-dim">Backups salvos ({backups.data?.length ?? 0})</p>
        <ul className="max-h-72 divide-y divide-border/40 overflow-y-auto rounded-xl border border-border/60">
          {backups.data?.length === 0 && <li className="p-3 text-sm text-text-dim">Nenhum backup ainda.</li>}
          {backups.data?.map((backup) => {
            const kind = KIND_LABEL[backup.kind];
            return (
              <li key={backup.fileName} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                <Badge tone={kind.tone}>{kind.label}</Badge>
                <span className="flex-1 truncate font-mono text-xs text-text-dim">{backup.fileName}</span>
                <span className="text-xs text-text-dim">{formatBytes(backup.sizeBytes)}</span>
                <span className="text-xs text-text-dim">{formatDateTime(backup.createdAt)}</span>
                <a
                  href={`/api/backups/${encodeURIComponent(backup.fileName)}/download`}
                  aria-label={`Baixar ${backup.fileName}`}
                  className="text-primary hover:text-star"
                >
                  <Download className="h-4 w-4" />
                </a>
              </li>
            );
          })}
        </ul>
      </div>

      <Modal
        open={pendingImport !== null}
        onClose={() => setPendingImport(null)}
        title="Importar dados?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingImport(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              icon={Upload}
              loading={importData.isPending}
              onClick={() => pendingImport && importData.mutate(pendingImport.data)}
            >
              Substituir meus dados
            </Button>
          </>
        }
      >
        <p className="text-sm text-text-dim">
          O arquivo <span className="font-mono text-text">{pendingImport?.name}</span> vai{' '}
          <strong className="text-warning">substituir todos os dados atuais</strong>. Antes disso, a Polaris
          faz um backup automático, então dá para voltar atrás.
        </p>
        <p className="mt-3 text-sm text-text-dim">
          Credenciais de integrações só funcionam se o arquivo veio deste mesmo computador (mesma chave
          POLARIS_SECRET). Se vier de outro, basta configurá-las de novo.
        </p>
      </Modal>
    </PolarisCard>
  );
}
