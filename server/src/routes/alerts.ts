import { Router } from 'express';
import { getDashboardAlerts } from '../services/alertService';

export const alertsRouter = Router();

alertsRouter.get('/', async (_req, res) => {
  res.json(await getDashboardAlerts());
});
