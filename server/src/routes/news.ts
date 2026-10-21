import { Router } from 'express';
import { badRequest } from '../lib/http';
import { validateFeedUrl } from '../services/integrationService';
import * as news from '../services/newsService';

export const newsRouter = Router();

newsRouter.get('/', async (req, res) => {
  res.json(
    await news.getNewsFeed({
      category: typeof req.query.category === 'string' && req.query.category ? req.query.category : undefined,
      query: typeof req.query.q === 'string' ? req.query.q : undefined,
      unreadOnly: req.query.unread === '1',
    }),
  );
});
newsRouter.post('/refresh', async (_req, res) => {
  res.json(await news.getNewsFeed({ force: true }));
});
newsRouter.post('/read', (req, res) => {
  news.markRead(req.body?.link, req.body?.read !== false);
  res.status(204).end();
});
newsRouter.get('/saved', (_req, res) => {
  res.json(news.listSaved());
});
newsRouter.post('/saved', (req, res) => {
  res.status(201).json(news.saveArticle(req.body));
});
newsRouter.delete('/saved/:id', (req, res) => {
  news.removeSaved(req.params.id);
  res.status(204).end();
});

newsRouter.get('/feeds', (_req, res) => {
  res.json(news.listFeeds());
});
newsRouter.post('/feeds/validate', async (req, res) => {
  const url = String(req.body?.url ?? '').trim();
  if (!url) throw badRequest('Informe o endereço do feed.');
  res.json(await validateFeedUrl(url));
});
newsRouter.post('/feeds', async (req, res) => {
  res.status(201).json(await news.addFeed(req.body));
});
newsRouter.patch('/feeds/:id', (req, res) => {
  res.json(news.updateFeed(req.params.id, req.body));
});
newsRouter.delete('/feeds/:id', (req, res) => {
  news.removeFeed(req.params.id);
  res.status(204).end();
});
