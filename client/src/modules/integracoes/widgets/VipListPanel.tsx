import type { VipSender } from '@polaris/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { api, errorMessage } from '../../../lib/api';
import { toast } from '../../../stores/toastStore';

/** Remetentes VIP: os e-mails deles sempre aparecem e vão para "Responder". */
export function VipListPanel() {
  const queryClient = useQueryClient();
  const vips = useQuery({ queryKey: ['vips'], queryFn: () => api.get<VipSender[]>('/email/vips') });
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['vips'] });
    void queryClient.invalidateQueries({ queryKey: ['hub', 'email'] });
  };
  const add = useMutation({
    mutationFn: () => api.post<VipSender>('/email/vips', { email, name: name || null }),
    onSuccess: () => {
      setEmail('');
      setName('');
      refresh();
    },
    onError: (error) => toast.error('Não foi possível adicionar', errorMessage(error)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/email/vips/${id}`),
    onSuccess: refresh,
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-dim">
        E-mails destes remetentes sempre aparecem no Polaris, mesmo fora do filtro de importância.
      </p>
      <ul className="divide-y divide-border/40 rounded-xl border border-border/60">
        {vips.data?.length === 0 && <li className="p-3 text-sm text-text-dim">Nenhum VIP ainda.</li>}
        {vips.data?.map((v) => (
          <li key={v.id} className="flex items-center gap-3 p-3 text-sm">
            <Star className="h-4 w-4 fill-warning text-warning" aria-hidden />
            <span className="flex-1">
              {v.name && <span className="font-medium">{v.name} · </span>}
              <span className="font-mono text-xs text-text-dim">{v.email}</span>
            </span>
            <Button
              size="icon"
              variant="ghost"
              icon={Trash2}
              aria-label={`Remover ${v.email}`}
              onClick={() => remove.mutate(v.id)}
            />
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemplo.com"
          className="min-w-52 flex-1"
          aria-label="E-mail do VIP"
        />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome (opcional)"
          className="w-40"
          aria-label="Nome do VIP"
        />
        <Button
          icon={Plus}
          loading={add.isPending}
          disabled={!email.includes('@')}
          onClick={() => add.mutate()}
        >
          Adicionar
        </Button>
      </div>
    </div>
  );
}
