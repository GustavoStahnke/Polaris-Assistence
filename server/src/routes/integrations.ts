import { Router } from 'express';
import { badRequest } from '../lib/http';
import {
  connectIntegration,
  disconnectIntegration,
  getIntegrationView,
  listIntegrations,
  listLogs,
  searchCities,
  syncAll,
  syncIntegration,
  testIntegration,
  updateIntegration,
} from '../services/integrationService';

// Rotas finas do Hub de Integrações: só recebem e respondem.
export const integrationsRouter = Router();

integrationsRouter.get('/', (_req, res) => {
  res.json(listIntegrations());
});

integrationsRouter.post('/sync-all', async (_req, res) => {
  res.json(await syncAll());
});

integrationsRouter.get('/open-meteo/geocode', async (req, res) => {
  const query = String(req.query.q ?? '').trim();
  if (query.length < 2) throw badRequest('Digite pelo menos 2 letras.');
  res.json(await searchCities(query));
});

integrationsRouter.get('/:id', (req, res) => {
  res.json(getIntegrationView(req.params.id));
});

integrationsRouter.patch('/:id', (req, res) => {
  res.json(updateIntegration(req.params.id, req.body));
});

integrationsRouter.post('/:id/test', async (req, res) => {
  res.json(await testIntegration(req.params.id));
});

integrationsRouter.post('/:id/connect', async (req, res) => {
  res.json(await connectIntegration(req.params.id));
});

integrationsRouter.post('/:id/sync', async (req, res) => {
  res.json(await syncIntegration(req.params.id));
});

integrationsRouter.post('/:id/disconnect', async (req, res) => {
  res.json(await disconnectIntegration(req.params.id));
});

integrationsRouter.get('/:id/logs', (req, res) => {
  res.json(listLogs(req.params.id));
});
