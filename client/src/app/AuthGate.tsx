import type { AuthStatus } from '@polaris/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Delete, LockKeyhole } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Background } from '../components/core/Background';
import { StarIcon } from '../components/core/Logo';
import { Button } from '../components/ui/Button';
import { api, errorMessage, type ApiError } from '../lib/api';

/**
 * Modo rede local: no celular (outro aparelho), pede o PIN antes de mostrar o Polaris.
 * No próprio computador, passa direto.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const status = useQuery({
    queryKey: ['auth-status'],
    queryFn: () => api.get<AuthStatus>('/auth/status'),
    retry: 1,
  });
  const [locked, setLocked] = useState(false);

  // Se a sessão expirar no meio do uso, qualquer resposta "PIN_REQUIRED" volta para a tela do PIN.
  useEffect(() => {
    const onError = (event: Event) => {
      if ((event as CustomEvent<ApiError>).detail?.code === 'PIN_REQUIRED') setLocked(true);
    };
    window.addEventListener('polaris:api-error', onError);
    return () => window.removeEventListener('polaris:api-error', onError);
  }, []);

  const needsPin = locked || (status.data?.required && !status.data.authenticated);
  if (status.isPending) return null;
  if (needsPin) {
    return (
      <PinScreen
        onUnlocked={() => {
          setLocked(false);
          void queryClient.invalidateQueries();
        }}
      />
    );
  }
  return <>{children}</>;
}

function PinScreen({ onUnlocked }: { onUnlocked: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (value: string) => {
    if (value.length < 4) return;
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/pin', { pin: value });
      onUnlocked();
    } catch (e) {
      setError(errorMessage(e));
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const press = (digit: string) => {
    if (pin.length >= 8) return;
    setPin(pin + digit);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <Background />
      <div className="glass w-full max-w-xs bg-bg-base/80 p-6 text-center">
        <StarIcon className="mx-auto h-12 w-12" />
        <h1 className="glow-text mt-3 font-display text-xl font-bold tracking-[0.2em] text-star">POLARIS</h1>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-text-dim">
          <LockKeyhole className="h-4 w-4" aria-hidden /> Digite o PIN de acesso
        </p>
        <div className="my-5 flex justify-center gap-2" aria-label={`${pin.length} dígitos digitados`}>
          {Array.from({ length: Math.max(4, pin.length) }, (_, i) => (
            <span
              key={i}
              className={`h-3 w-3 rounded-full ${i < pin.length ? 'bg-star shadow-[0_0_8px_rgba(165,243,252,0.9)]' : 'bg-primary/20'}`}
            />
          ))}
        </div>
        {error && (
          <p className="mb-3 text-sm text-danger" role="alert">
            {error}
          </p>
        )}
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => press(d)}
              className="h-14 rounded-xl border border-border bg-bg-deep/50 font-mono text-xl transition-colors hover:border-primary hover:text-star"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            aria-label="Apagar"
            onClick={() => setPin(pin.slice(0, -1))}
            className="flex h-14 items-center justify-center text-text-dim hover:text-star"
          >
            <Delete className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => press('0')}
            className="h-14 rounded-xl border border-border bg-bg-deep/50 font-mono text-xl transition-colors hover:border-primary hover:text-star"
          >
            0
          </button>
          <span />
        </div>
        <Button
          variant="primary"
          className="mt-4 w-full justify-center"
          loading={loading}
          disabled={pin.length < 4}
          onClick={() => void submit(pin)}
        >
          Entrar
        </Button>
      </div>
    </div>
  );
}
