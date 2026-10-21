import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { getSecretKey } from './secret';

// PIN do modo rede local: guardado como hash scrypt (nunca o número em si).

export function hashPin(pin: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(pin, salt, 32);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPin(pin: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const [kind, salt, hash] = stored.split('$');
  if (kind !== 'scrypt' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = scryptSync(pin, Buffer.from(salt, 'base64'), expected.length);
  return timingSafeEqual(actual, expected);
}

// Sessão do celular: um cookie assinado com HMAC (chave POLARIS_SECRET), válido por 30 dias.

export const SESSION_COOKIE = 'polaris_session';
export const SESSION_DAYS = 30;

const sign = (payload: string) => createHmac('sha256', getSecretKey()).update(payload).digest('base64url');

export function createSessionToken(now: Date = new Date()): string {
  const payload = `${now.getTime()}.${randomBytes(12).toString('base64url')}`;
  return `${payload}.${sign(payload)}`;
}

/** Confere a assinatura, a validade e se a sessão é posterior à última troca de PIN. */
export function verifySessionToken(
  token: string | undefined,
  pinChangedAt: number,
  now: Date = new Date(),
): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [issued, nonce, signature] = parts as [string, string, string];
  const expected = sign(`${issued}.${nonce}`);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected)))
    return false;
  const issuedAt = Number(issued);
  if (!Number.isFinite(issuedAt) || issuedAt < pinChangedAt) return false;
  return now.getTime() - issuedAt <= SESSION_DAYS * 86400_000;
}

/** Lê um cookie do cabeçalho (sem precisar de biblioteca). */
export function readCookie(header: string | undefined, name: string): string | undefined {
  for (const part of (header ?? '').split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}
