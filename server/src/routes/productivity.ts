import { Router } from 'express';
import * as habits from '../services/habitService';
import * as productivity from '../services/productivityService';
import { searchEverything } from '../services/searchService';

// Rotas de Notas, Tarefas, Lembretes, Hábitos e da busca global.

export const notesRouter = Router();
notesRouter.get('/', (req, res) => {
  res.json(productivity.listNotes(typeof req.query.q === 'string' ? req.query.q : undefined));
});
notesRouter.post('/', (req, res) => {
  res.status(201).json(productivity.createNote(req.body));
});
notesRouter.patch('/:id', (req, res) => {
  res.json(productivity.updateNote(req.params.id, req.body));
});
notesRouter.delete('/:id', (req, res) => {
  productivity.deleteNote(req.params.id);
  res.status(204).end();
});

export const tasksRouter = Router();
tasksRouter.get('/', (_req, res) => {
  res.json(productivity.listTasks());
});
tasksRouter.get('/today', (_req, res) => {
  res.json(productivity.getTodayAgenda());
});
tasksRouter.post('/', (req, res) => {
  res.status(201).json(productivity.createTask(req.body));
});
tasksRouter.patch('/:id', (req, res) => {
  res.json(productivity.updateTask(req.params.id, req.body));
});
tasksRouter.delete('/:id', (req, res) => {
  productivity.deleteTask(req.params.id);
  res.status(204).end();
});

export const remindersRouter = Router();
remindersRouter.get('/', (_req, res) => {
  res.json(productivity.listReminders());
});
remindersRouter.get('/due', (_req, res) => {
  res.json(productivity.listDueReminders());
});
remindersRouter.post('/', (req, res) => {
  res.status(201).json(productivity.createReminder(req.body));
});
remindersRouter.patch('/:id', (req, res) => {
  res.json(productivity.updateReminder(req.params.id, req.body));
});
remindersRouter.post('/:id/ack', (req, res) => {
  res.json(productivity.acknowledgeReminder(req.params.id));
});
remindersRouter.delete('/:id', (req, res) => {
  productivity.deleteReminder(req.params.id);
  res.status(204).end();
});

export const habitsRouter = Router();
habitsRouter.get('/', (_req, res) => {
  res.json(habits.listHabits());
});
habitsRouter.get('/heatmap', (req, res) => {
  const year =
    typeof req.query.year === 'string' && /^\d{4}$/.test(req.query.year)
      ? Number(req.query.year)
      : new Date().getFullYear();
  res.json(habits.getHeatmap(year, typeof req.query.habitId === 'string' ? req.query.habitId : undefined));
});
habitsRouter.post('/', (req, res) => {
  res.status(201).json(habits.createHabit(req.body));
});
habitsRouter.patch('/:id', (req, res) => {
  res.json(habits.updateHabit(req.params.id, req.body));
});
habitsRouter.post('/:id/toggle', (req, res) => {
  res.json(habits.toggleHabit(req.params.id, req.body));
});
habitsRouter.post('/:id/archive', (req, res) => {
  habits.archiveHabit(req.params.id);
  res.status(204).end();
});
habitsRouter.delete('/:id', (req, res) => {
  habits.deleteHabit(req.params.id);
  res.status(204).end();
});

export const searchRouter = Router();
searchRouter.get('/', (req, res) => {
  res.json(searchEverything(String(req.query.q ?? '')));
});
