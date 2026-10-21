import type { OllamaModel } from '@polaris/shared';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Input';
import { api, errorMessage } from '../../../lib/api';
import { formatBytes } from '../../../lib/format';
import type { WidgetProps } from './types';

/** Lista os modelos instalados no Ollama (do endereço digitado no formulário) para escolher. */
export function ModelSelect({ id, value, onChange, values }: WidgetProps) {
  const url = typeof values.url === 'string' ? values.url : '';
  const models = useQuery({
    queryKey: ['ollama-models', url],
    queryFn: () => api.get<OllamaModel[]>(`/ai/models?url=${encodeURIComponent(url)}`),
    retry: 0,
  });

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Select
          id={id}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          disabled={!models.data?.length}
        >
          <option value="">{models.isPending ? 'Procurando modelos…' : 'Escolha um modelo'}</option>
          {models.data?.map((m) => (
            <option key={m.name} value={m.name}>
              {m.name}
              {m.parameterSize ? ` · ${m.parameterSize}` : ''}
              {m.sizeBytes ? ` · ${formatBytes(m.sizeBytes)}` : ''}
            </option>
          ))}
        </Select>
        <Button
          size="icon"
          variant="ghost"
          icon={RefreshCw}
          aria-label="Procurar modelos de novo"
          loading={models.isFetching}
          onClick={() => void models.refetch()}
        />
      </div>
      {models.isError && (
        <p className="text-xs text-danger">
          Não encontrei o Ollama nesse endereço ({errorMessage(models.error)}). Ele está aberto?
        </p>
      )}
      {models.data?.length === 0 && (
        <p className="text-xs text-warning">
          Nenhum modelo instalado. Rode no terminal: ollama pull llama3.2:3b
        </p>
      )}
    </div>
  );
}
