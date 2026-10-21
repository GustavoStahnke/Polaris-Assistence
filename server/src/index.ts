import { APP_NAME } from '@polaris/shared';
import http from 'node:http';
import { loadEnvironment } from './config/env';

// 1. Ambiente (.env + POLARIS_SECRET). Precisa vir antes de tudo.
const env = loadEnvironment();

// 2. Banco de dados (importado depois do ambiente estar pronto)
const { prepareDatabase } = await import('./bootstrap');
await prepareDatabase();

// 3. Endereços usados pelo login do Google
const { setClientOrigin } = await import('./config/runtime');
const { setGoogleRedirectUri } = await import('./integrations/google/auth');
setClientOrigin(env.isProduction ? '' : 'http://localhost:5173');
setGoogleRedirectUri(`http://localhost:${env.port}/api/integrations/google/callback`);

// 4. Aplicação Express
const { createApp } = await import('./app');
const { startJobs } = await import('./jobs');
const app = createApp({ serveClient: env.isProduction });
const server = http.createServer(app);

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ A porta ${env.port} já está em uso. Feche o outro processo ou mude PORT no .env.`);
  } else {
    console.error('❌ Não foi possível iniciar o servidor:', err);
  }
  process.exit(1);
});

// 5. Escuta só neste PC (127.0.0.1), ou na rede local se o modo celular estiver ligado.
const { listen } = await import('./serverControl');
const { startupHost } = await import('./services/networkService');
const host = startupHost(env.host);
await listen(server, env.port, host);
const mode = env.isProduction ? 'produção' : 'desenvolvimento';
console.log(`✨ ${APP_NAME} online em http://localhost:${env.port} (${mode})`);
if (host === '0.0.0.0') console.log('📱 Modo rede local ligado: outros aparelhos acessam com PIN.');
startJobs();
