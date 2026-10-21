import { Router } from 'express';
import { badRequest } from '../lib/http';
import { validateFeedUrl } from '../services/integrationService';
import { addFeed, listFeeds, removeFeed, updateFeed } from '../services/newsService';

export const newsRouter = Router();

newsRouter.get('/feeds', (_req, res) => {
  res.json(listFeeds());
});

newsRouter.post('/feeds/validate', async (req, res) => {
  const url = String(req.body?.url ?? '').trim();
  if (!url) throw badRequest('Informe o endereço do feed.');
  res.json(await validateFeedUrl(url));
});

newsRouter.post('/feeds', async (req, res) => {
  res.status(201).json(await addFeed(req.body));
});

newsRouter.patch('/feeds/:id', (req, res) => {
  res.json(updateFeed(req.params.id, req.body));
});

newsRouter.delete('/feeds/:id', (req, res) => {
  removeFeed(req.params.id);
  res.status(204).end();
});
