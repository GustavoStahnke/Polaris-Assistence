import { APP_NAME } from '@polaris/shared';
import http from 'node:http';
import { createApp } from './app';
import { loadEnvironment } from './config/env';

// 1. Ambiente (.env + POLARIS_SECRET)
const env = loadEnvironment();

// 2. Aplicação Express
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

server.listen(env.port, env.host, () => {
  const mode = env.isProduction ? 'produção' : 'desenvolvimento';
  console.log(`✨ ${APP_NAME} online em http://localhost:${env.port} (${mode})`);
});
