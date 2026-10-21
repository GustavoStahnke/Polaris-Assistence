import type http from 'node:http';

// Controla em qual endereço o servidor escuta (127.0.0.1 = só este PC; 0.0.0.0 = rede local).

let server: http.Server | null = null;
let port = 3001;
let currentHost = '127.0.0.1';

export function listen(instance: http.Server, listenPort: number, host: string): Promise<void> {
  server = instance;
  port = listenPort;
  currentHost = host;
  return new Promise((resolve) => instance.listen(port, host, resolve));
}

export const getListeningHost = () => currentHost;
export const getPort = () => port;

/** Troca o endereço de escuta sem reiniciar o processo. */
export async function rebind(host: string): Promise<void> {
  if (!server || host === currentHost) return;
  const instance = server;
  await new Promise<void>((resolve) => {
    instance.close(() => resolve());
    instance.closeAllConnections();
  });
  currentHost = host;
  await new Promise<void>((resolve) => instance.listen(port, host, resolve));
  console.log(
    host === '0.0.0.0'
      ? '📱 Modo rede local ligado (protegido por PIN).'
      : '🔒 Modo rede local desligado: só este computador.',
  );
}
