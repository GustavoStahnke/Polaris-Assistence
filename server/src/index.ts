import { APP_NAME } from '@polaris/shared';
import http from 'node:http';
import { loadEnvironment } from './config/env';

// 1. Ambiente (.env + POLARIS_SECRET). Precisa vir antes de tudo.
const env = loadEnvironment();

// 2. Banco de dados (importado depois do ambiente estar pronto)
const { prepareDatabase } = await import('./bootstrap');
await prepareDatabase();

// 3. Aplicação Express
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

server.listen(env.port, env.host, () => {
  const mode = env.isProduction ? 'produção' : 'desenvolvimento';
  console.log(`✨ ${APP_NAME} online em http://localhost:${env.port} (${mode})`);
  startJobs();
});
