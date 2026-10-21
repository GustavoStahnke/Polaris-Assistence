import { Router } from 'express';
import * as ai from '../services/aiService';
import { getBriefing } from '../services/briefingService';
import { listOllamaModels } from '../services/integrationService';

export const aiRouter = Router();

aiRouter.get('/status', (_req, res) => {
  res.json(ai.getStatus());
});
aiRouter.get('/models', async (req, res) => {
  res.json(await listOllamaModels(typeof req.query.url === 'string' ? req.query.url : undefined));
});
aiRouter.get('/conversations', (_req, res) => {
  res.json(ai.listConversations());
});
aiRouter.get('/conversations/:id', (req, res) => {
  res.json(ai.getConversation(req.params.id));
});
aiRouter.delete('/conversations/:id', (req, res) => {
  ai.deleteConversation(req.params.id);
  res.status(204).end();
});
aiRouter.post('/chat', async (req, res) => {
  res.json(await ai.chat(req.body));
});
aiRouter.post('/books/:bookId/summary', async (req, res) => {
  res.json(await ai.generateBookSummary(req.params.bookId));
});
aiRouter.put('/books/:bookId/summary', (req, res) => {
  res.json(ai.updateBookSummary(req.params.bookId, req.body?.content));
});

export const briefingRouter = Router();
briefingRouter.get('/', async (_req, res) => {
  res.json(await getBriefing());
});
briefingRouter.get('/ai', async (req, res) => {
  res.json(await ai.getAiBriefing({ force: req.query.force === '1' }));
});
