import { Router } from 'express';
import { getWeatherReport } from '../services/weatherService';

export const weatherRouter = Router();

weatherRouter.get('/', async (_req, res) => {
  res.json(await getWeatherReport());
});
weatherRouter.post('/refresh', async (_req, res) => {
  res.json(await getWeatherReport({ force: true }));
});
