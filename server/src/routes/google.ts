import { Router } from 'express';
import { getClientOrigin } from '../config/runtime';
import { getAgenda } from '../services/agendaService';
import { addVip, getEmails, listVips, removeVip, setTriage } from '../services/emailService';

export const agendaRouter = Router();
agendaRouter.get('/', async (req, res) => {
  res.json(await getAgenda(req.query.range === 'semana' ? 'semana' : 'hoje'));
});
agendaRouter.post('/refresh', async (req, res) => {
  res.json(await getAgenda(req.query.range === 'semana' ? 'semana' : 'hoje', new Date(), { force: true }));
});

export const emailRouter = Router();
emailRouter.get('/', async (_req, res) => {
  res.json(await getEmails());
});
emailRouter.post('/refresh', async (_req, res) => {
  res.json(await getEmails({ force: true }));
});
emailRouter.patch('/:messageId/triage', (req, res) => {
  setTriage(req.params.messageId, req.body);
  res.status(204).end();
});
emailRouter.get('/vips', (_req, res) => {
  res.json(listVips());
});
emailRouter.post('/vips', (req, res) => {
  res.status(201).json(addVip(req.body));
});
emailRouter.delete('/vips/:id', (req, res) => {
  removeVip(req.params.id);
  res.status(204).end();
});

/** Para onde voltar depois do login do Google (a interface mostra o resultado). */
export function googleReturnUrl(ok: boolean, message: string): string {
  const params = new URLSearchParams({
    config: 'google-account',
    google: ok ? 'ok' : 'erro',
    mensagem: message,
  });
  return `${getClientOrigin()}/integracoes?${params.toString()}`;
}
