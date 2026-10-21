import { Router } from 'express';
import { apiNotFound } from '../lib/http';
import { backupsRouter } from './backups';
import { healthRouter } from './health';
import { settingsRouter } from './settings';
import { systemRouter } from './system';

/** Todas as rotas da API, montadas em /api. */
export function createApiRouter() {
  const api = Router();
  api.use('/health', healthRouter);
  api.use('/settings', settingsRouter);
  api.use('/backups', backupsRouter);
  api.use('/system', systemRouter);
  api.use(apiNotFound);
  return api;
}
