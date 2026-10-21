import { Router } from 'express';
import { apiNotFound } from '../lib/http';
import { alertsRouter } from './alerts';
import { backupsRouter } from './backups';
import { gymRouter } from './gym';
import { healthRouter } from './health';
import { integrationsRouter } from './integrations';
import { libraryRouter } from './library';
import { newsRouter } from './news';
import { settingsRouter } from './settings';
import { systemRouter } from './system';
import { weatherRouter } from './weather';

/** Todas as rotas da API, montadas em /api. */
export function createApiRouter() {
  const api = Router();
  api.use('/health', healthRouter);
  api.use('/settings', settingsRouter);
  api.use('/backups', backupsRouter);
  api.use('/system', systemRouter);
  api.use('/integrations', integrationsRouter);
  api.use('/news', newsRouter);
  api.use('/gym', gymRouter);
  api.use('/library', libraryRouter);
  api.use('/weather', weatherRouter);
  api.use('/alerts', alertsRouter);
  api.use(apiNotFound);
  return api;
}
