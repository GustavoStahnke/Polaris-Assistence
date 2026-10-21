import { APP_NAME, type HealthResponse } from '@polaris/shared';
import { useEffect, useState } from 'react';
import { fetchHealth } from '../lib/api';

type ServerState = { kind: 'loading' } | { kind: 'online'; health: HealthResponse } | { kind: 'offline' };

export function App() {
  const [server, setServer] = useState<ServerState>({ kind: 'loading' });

  useEffect(() => {
    fetchHealth()
      .then((health) => setServer({ kind: 'online', health }))
      .catch(() => setServer({ kind: 'offline' }));
  }, []);

  return (
    <main className="boot">
      <img src="/polaris-star.svg" alt="" className="boot-star" />
      <h1>POLARIS</h1>
      <p className="boot-subtitle">{APP_NAME}</p>
      {server.kind === 'loading' && <p className="boot-status">Conectando ao servidor…</p>}
      {server.kind === 'online' && (
        <p className="boot-status ok">● Polaris online · servidor v{server.health.version}</p>
      )}
      {server.kind === 'offline' && (
        <p className="boot-status error">● Servidor offline. Rode "npm run dev" no terminal.</p>
      )}
    </main>
  );
}
