import { Router } from 'express';
import * as gym from '../services/gymService';

// Rotas da Academia (finas: recebem, chamam o service e respondem).
export const gymRouter = Router();

gymRouter.get('/exercises', (_req, res) => {
  res.json(gym.listExercises());
});
gymRouter.post('/exercises', (req, res) => {
  res.status(201).json(gym.createExercise(req.body));
});
gymRouter.patch('/exercises/:id', (req, res) => {
  res.json(gym.updateExercise(req.params.id, req.body));
});
gymRouter.delete('/exercises/:id', (req, res) => {
  gym.deleteExercise(req.params.id);
  res.status(204).end();
});

gymRouter.get('/routines', (_req, res) => {
  res.json(gym.listRoutines());
});
gymRouter.post('/routines', (req, res) => {
  res.status(201).json(gym.saveRoutine(null, req.body));
});
gymRouter.put('/routines/:id', (req, res) => {
  res.json(gym.saveRoutine(req.params.id, req.body));
});
gymRouter.delete('/routines/:id', (req, res) => {
  gym.deleteRoutine(req.params.id);
  res.status(204).end();
});

gymRouter.get('/today', (_req, res) => {
  res.json(gym.getToday());
});

gymRouter.get('/sessions', (req, res) => {
  res.json(
    gym.listSessions({
      from: typeof req.query.from === 'string' ? req.query.from : undefined,
      to: typeof req.query.to === 'string' ? req.query.to : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    }),
  );
});
gymRouter.post('/sessions', (req, res) => {
  res.status(201).json(gym.startSession(req.body));
});
gymRouter.get('/sessions/active', (_req, res) => {
  res.json(gym.getActiveSession());
});
gymRouter.get('/sessions/:id', (req, res) => {
  res.json({ session: gym.getSession(req.params.id), records: gym.listRecordsForSession(req.params.id) });
});
gymRouter.post('/sessions/:id/sets', (req, res) => {
  res.status(201).json(gym.addSet(req.params.id, req.body));
});
gymRouter.post('/sessions/:id/finish', (req, res) => {
  res.json(gym.finishSession(req.params.id, req.body));
});
gymRouter.delete('/sessions/:id', (req, res) => {
  gym.deleteSession(req.params.id);
  res.status(204).end();
});

gymRouter.patch('/sets/:id', (req, res) => {
  res.json(gym.updateSet(req.params.id, req.body));
});
gymRouter.delete('/sets/:id', (req, res) => {
  res.json(gym.deleteSet(req.params.id));
});

gymRouter.get('/progress/:exerciseId', (req, res) => {
  res.json(gym.getExerciseProgress(req.params.exerciseId));
});
gymRouter.get('/records', (_req, res) => {
  res.json(gym.listRecords());
});

gymRouter.get('/measurements', (_req, res) => {
  res.json(gym.listMeasurements());
});
gymRouter.post('/measurements', (req, res) => {
  res.status(201).json(gym.createMeasurement(req.body));
});
gymRouter.delete('/measurements/:id', (req, res) => {
  gym.deleteMeasurement(req.params.id);
  res.status(204).end();
});
