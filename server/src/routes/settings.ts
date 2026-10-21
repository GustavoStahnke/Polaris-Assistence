import { Router } from 'express';
import { getProfile, updateProfile } from '../services/settingsService';

export const settingsRouter = Router();

settingsRouter.get('/profile', (_req, res) => {
  res.json(getProfile());
});

settingsRouter.put('/profile', (req, res) => {
  res.json(updateProfile(req.body));
});
