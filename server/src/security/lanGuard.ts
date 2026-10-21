import type { Request, RequestHandler } from 'express';
import { isSessionValid } from '../services/networkService';
import { readCookie, SESSION_COOKIE } from './pin';

/** true quando a requisição vem do próprio computador. */
export function isLocalRequest(req: Request): boolean {
  const address = req.socket.remoteAddress ?? '';
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
}

export const sessionFrom = (req: Request) => readCookie(req.headers.cookie, SESSION_COOKIE);

/**
 * Proteção do modo rede local: quem acessa de outro aparelho só usa a API depois de digitar o PIN.
 * A interface (arquivos estáticos) carrega normalmente, para mostrar a tela do PIN.
 */
export const lanGuard: RequestHandler = (req, res, next) => {
  if (isLocalRequest(req)) return next();
  const open = req.path.startsWith('/auth/') || req.path === '/health';
  if (open || isSessionValid(sessionFrom(req))) return next();
  res.status(401).json({ error: { code: 'PIN_REQUIRED', message: 'Digite o PIN para acessar o Polaris.' } });
};
