import { Router } from 'express';
import { getSystemInfo } from '../services/systemService';

export const systemRouter = Router();

systemRouter.get('/info', (_req, res) => {
  res.json(getSystemInfo());
});
