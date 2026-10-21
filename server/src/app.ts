import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { CLIENT_DIST_DIR } from './config/paths';
import { errorHandler } from './lib/http';
import { createApiRouter } from './routes';

interface AppOptions {
  /** Em produção, o servidor também entrega o client buildado. */
  serveClient: boolean;
}

export function createApp({ serveClient }: AppOptions) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '50mb' }));

  // Rotas da API
  app.use('/api', createApiRouter());

  // Client buildado (npm start)
  if (serveClient) {
    const indexHtml = path.join(CLIENT_DIST_DIR, 'index.html');
    if (!fs.existsSync(indexHtml)) {
      console.warn('⚠️  client/dist não encontrado. Rode "npm run build" antes de "npm start".');
    }
    app.use(express.static(CLIENT_DIST_DIR, { index: false }));
    // Qualquer outra rota GET devolve o index.html (o React Router cuida da navegação).
    app.use((req, res, next) => {
      if (req.method !== 'GET' || !fs.existsSync(indexHtml)) return next();
      res.sendFile(indexHtml);
    });
  }

  app.use(errorHandler);
  return app;
}
