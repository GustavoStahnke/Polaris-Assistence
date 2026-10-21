import { Router } from 'express';
import { isLocalRequest, sessionFrom } from '../security/lanGuard';
import { SESSION_COOKIE, SESSION_DAYS } from '../security/pin';
import {
  getNetworkStatus,
  isSessionValid,
  loginWithPin,
  qrCodeSvg,
  updateNetwork,
} from '../services/networkService';

export const networkRouter = Router();

networkRouter.get('/', (req, res) => {
  res.json(getNetworkStatus(isLocalRequest(req)));
});
networkRouter.put('/', async (req, res) => {
  res.json(await updateNetwork(req.body, isLocalRequest(req)));
});
networkRouter.get('/qr', async (req, res) => {
  res.type('image/svg+xml').send(await qrCodeSvg(String(req.query.url ?? '')));
});

export const authRouter = Router();

authRouter.get('/status', (req, res) => {
  const required = !isLocalRequest(req);
  res.json({ required, authenticated: !required || isSessionValid(sessionFrom(req)) });
});
authRouter.post('/pin', (req, res) => {
  const token = loginWithPin(req.body, req.socket.remoteAddress ?? 'desconhecido');
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_DAYS * 86400_000,
    path: '/',
  });
  res.status(204).end();
});
