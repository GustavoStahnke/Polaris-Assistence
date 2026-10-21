import { Router } from 'express';
import { apiNotFound } from '../lib/http';
import { alertsRouter } from './alerts';
import { backupsRouter } from './backups';
import { agendaRouter, emailRouter } from './google';
import { gymRouter } from './gym';
import { healthRouter } from './health';
import { integrationsRouter } from './integrations';
import { libraryRouter } from './library';
import { newsRouter } from './news';
import { habitsRouter, notesRouter, remindersRouter, searchRouter, tasksRouter } from './productivity';
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
  api.use('/notes', notesRouter);
  api.use('/tasks', tasksRouter);
  api.use('/reminders', remindersRouter);
  api.use('/habits', habitsRouter);
  api.use('/search', searchRouter);
  api.use('/agenda', agendaRouter);
  api.use('/email', emailRouter);
  api.use(apiNotFound);
  return api;
}
