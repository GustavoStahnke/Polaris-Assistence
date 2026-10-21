import { Router } from 'express';
import * as library from '../services/libraryService';

// Rotas da Biblioteca.
export const libraryRouter = Router();

const queryString = (value: unknown) => (typeof value === 'string' ? value : undefined);

libraryRouter.get('/books', (req, res) => {
  res.json(library.listBooks({ status: queryString(req.query.status), query: queryString(req.query.q) }));
});
libraryRouter.post('/books', async (req, res) => {
  res.status(201).json(await library.createBook(req.body));
});
libraryRouter.get('/books/:id', (req, res) => {
  res.json(library.getBookDetail(req.params.id));
});
libraryRouter.patch('/books/:id', (req, res) => {
  res.json(library.updateBook(req.params.id, req.body));
});
libraryRouter.delete('/books/:id', (req, res) => {
  library.deleteBook(req.params.id);
  res.status(204).end();
});
libraryRouter.get('/books/:id/cover', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=604800');
  res.sendFile(library.getCoverPath(req.params.id));
});
libraryRouter.post('/books/:id/reading', (req, res) => {
  res.json(library.logReading(req.params.id, req.body));
});
libraryRouter.delete('/reading/:id', (req, res) => {
  library.deleteReadingSession(req.params.id);
  res.status(204).end();
});
libraryRouter.post('/books/:id/notes', (req, res) => {
  res.status(201).json(library.createNote(req.params.id, req.body));
});
libraryRouter.patch('/notes/:id', (req, res) => {
  res.json(library.updateNote(req.params.id, req.body));
});
libraryRouter.delete('/notes/:id', (req, res) => {
  library.deleteNote(req.params.id);
  res.status(204).end();
});

libraryRouter.get('/current', (_req, res) => {
  res.json(library.getCurrentReading());
});
libraryRouter.get('/remember', (_req, res) => {
  res.json(library.getRemember());
});
libraryRouter.get('/search', async (req, res) => {
  res.json(await library.searchCatalog(String(req.query.q ?? '')));
});

const yearOf = (value: unknown) =>
  typeof value === 'string' && /^\d{4}$/.test(value) ? Number(value) : new Date().getFullYear();

libraryRouter.get('/goal', (req, res) => {
  res.json(library.getGoal(yearOf(req.query.year)));
});
libraryRouter.put('/goal', (req, res) => {
  res.json(library.setGoal(req.body));
});
libraryRouter.get('/stats', (req, res) => {
  res.json(library.getStats(yearOf(req.query.year)));
});

libraryRouter.get('/recommendations', (_req, res) => {
  res.json(library.listRecommendations());
});
libraryRouter.post('/recommendations/refresh', async (_req, res) => {
  res.json(await library.refreshRecommendations());
});
libraryRouter.post('/recommendations/:id/add', async (req, res) => {
  res.status(201).json(await library.addRecommendationToShelf(req.params.id));
});
libraryRouter.delete('/recommendations/:id', (req, res) => {
  library.dismissRecommendation(req.params.id);
  res.status(204).end();
});
