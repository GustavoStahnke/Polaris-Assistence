import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { getSecretKey } from './secret';

// Criptografia AES-256-GCM para credenciais e tokens.
// Formato salvo: v1:<iv>:<tag>:<dados>, tudo em base64.

const VERSION = 'v1';

export function encrypt(plainText: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getSecretKey(), iv);
  const data = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString('base64'), tag.toString('base64'), data.toString('base64')].join(':');
}

export function decrypt(payload: string): string {
  const [version, iv, tag, data] = payload.split(':');
  if (version !== VERSION || !iv || !tag || !data) throw new Error('Formato de dado criptografado inválido.');
  const decipher = createDecipheriv('aes-256-gcm', getSecretKey(), Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
}

/** Criptografa um objeto como JSON. */
export const encryptJson = (value: unknown) => encrypt(JSON.stringify(value));

/** Descriptografa um JSON. Devolve null se não der (ex.: chave diferente). */
export function decryptJson<T>(payload: string | null | undefined): T | null {
  if (!payload) return null;
  try {
    return JSON.parse(decrypt(payload)) as T;
  } catch {
    return null;
  }
}
