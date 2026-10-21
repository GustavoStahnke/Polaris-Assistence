import type { NetworkStatus } from '@polaris/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Info, KeyRound, Smartphone, Wifi } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Field, Input, Switch } from '../../components/ui/Input';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { api, errorMessage } from '../../lib/api';
import { toast } from '../../stores/toastStore';

/** Acesso pelo celular: modo rede local com PIN, endereço e QR code. */
export function NetworkSection() {
  const queryClient = useQueryClient();
  const status = useQuery({ queryKey: ['network'], queryFn: () => api.get<NetworkStatus>('/network') });
  const [pin, setPin] = useState('');
  const data = status.data;

  const update = useMutation({
    mutationFn: (body: { enabled: boolean; pin?: string }) => api.put<NetworkStatus>('/network', body),
    onSuccess: (result) => {
      queryClient.setQueryData(['network'], result);
      setPin('');
      toast.success(
        result.enabled ? 'Modo rede local ligado' : 'Modo rede local desligado',
        result.enabled
          ? 'Abra o endereço no celular e digite o PIN.'
          : 'Só este computador acessa o Polaris.',
      );
      setTimeout(() => void queryClient.invalidateQueries({ queryKey: ['network'] }), 1500);
    },
    onError: (error) => toast.error('Não foi possível mudar', errorMessage(error)),
  });

  const validPin = /^\d{4,8}$/.test(pin);

  return (
    <div className="space-y-5">
      <PolarisCard
        icon={Smartphone}
        label="Configurações · Celular"
        title="Acesso pelo celular"
        badge={data?.enabled ? <Badge tone="success">Ligado</Badge> : <Badge tone="muted">Desligado</Badge>}
        state={status.isPending ? 'loading' : 'ready'}
      >
        <p className="text-sm text-text-dim">
          Com o modo rede local ligado, o celular conectado no mesmo Wi-Fi abre o Polaris pelo navegador. Todo
          acesso de outro aparelho pede o PIN.
        </p>

        {data && !data.isLocal ? (
          <p className="mt-4 text-sm text-warning">
            Por segurança, esta configuração só pode ser alterada no próprio computador.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 p-4">
              <div>
                <p className="font-medium">Modo rede local</p>
                <p className="text-sm text-text-dim">
                  {data?.enabled
                    ? `Aceitando conexões da rede (porta ${data.port}).`
                    : 'Só este computador acessa (127.0.0.1).'}
                </p>
              </div>
              <Switch
                checked={Boolean(data?.enabled)}
                disabled={update.isPending || (!data?.enabled && !data?.hasPin && !validPin)}
                onChange={(enabled) => update.mutate({ enabled, ...(validPin ? { pin } : {}) })}
                label="Modo rede local"
              />
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <Field label={data?.hasPin ? 'Trocar o PIN' : 'Defina um PIN (4 a 8 números)'} className="w-52">
                {(id) => (
                  <Input
                    id={id}
                    type="password"
                    inputMode="numeric"
                    autoComplete="new-password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="••••"
                  />
                )}
              </Field>
              <Button
                icon={KeyRound}
                disabled={!validPin}
                loading={update.isPending}
                onClick={() => update.mutate({ enabled: Boolean(data?.enabled), pin })}
              >
                {data?.hasPin ? 'Salvar novo PIN' : 'Salvar PIN'}
              </Button>
            </div>
            {data?.hasPin && (
              <p className="text-xs text-text-dim">
                Trocar o PIN desconecta os aparelhos que já tinham entrado.
              </p>
            )}
          </div>
        )}
      </PolarisCard>

      {data?.enabled && (
        <PolarisCard icon={Wifi} label="Configurações · Endereço" title="Abra no celular">
          {data.addresses.length === 0 ? (
            <p className="text-sm text-text-dim">
              Não encontrei uma rede local ativa. Confira se o computador está no Wi-Fi.
            </p>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {data.addresses.map((a) => (
                <div key={a.address} className="text-center">
                  <img
                    src={`/api/network/qr?url=${encodeURIComponent(a.url)}`}
                    alt={`QR code para ${a.url}`}
                    className="mx-auto h-44 w-44 rounded-xl border border-primary/50 bg-text p-1.5 shadow-[0_0_24px_rgba(56,189,248,0.3)]"
                  />
                  <p className="mt-2 font-mono text-star">{a.url}</p>
                  <p className="label-mono text-[10px] text-text-dim">{a.name}</p>
                </div>
              ))}
            </div>
          )}
          <p className="mt-4 text-xs text-text-dim">
            Use a versão final (<span className="font-mono">npm run build</span> e depois{' '}
            <span className="font-mono">npm start</span>) para acessar pelo celular. Se o celular não abrir,
            verifique se o firewall do computador permite conexões do Node.js.
          </p>
        </PolarisCard>
      )}

      <PolarisCard icon={Info} label="Configurações · Importante" title="O que esperar no celular">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-text-dim">
          <li>
            Pelo endereço local (http), o Polaris funciona no navegador do celular e pode virar um atalho na
            tela inicial.
          </li>
          <li>
            A instalação completa como app e o modo offline no celular exigem HTTPS. Isso vem na Fase 3 (web)
            ou usando uma ferramenta como o Tailscale.
          </li>
          <li>
            No computador, o Chrome já permite instalar o Polaris como app (ícone de instalar na barra de
            endereço).
          </li>
        </ul>
      </PolarisCard>
    </div>
  );
}
