import { randomBytes } from 'node:crypto';
import fs from 'node:fs';

const SECRET_KEY = 'POLARIS_SECRET';
const SECRET_LINE = /^POLARIS_SECRET=(.*)$/m;

/**
 * Garante que o arquivo .env existe e tem um POLARIS_SECRET.
 * - Se o .env não existir, cria a partir do .env.example.
 * - Se o segredo estiver vazio, gera um novo (32 bytes aleatórios em base64).
 * - NUNCA sobrescreve um segredo existente: sem ele, os dados criptografados ficariam ilegíveis.
 * Retorna true quando um segredo novo foi gerado.
 */
export function ensurePolarisSecret(envPath: string, examplePath: string): boolean {
  if (process.env[SECRET_KEY]) return false;

  if (!fs.existsSync(envPath)) {
    const template = fs.existsSync(examplePath) ? fs.readFileSync(examplePath, 'utf8') : '';
    fs.writeFileSync(envPath, template, 'utf8');
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(SECRET_LINE);
  if (match?.[1]?.trim()) return false;

  const secret = randomBytes(32).toString('base64');
  const updated = match
    ? content.replace(SECRET_LINE, `${SECRET_KEY}=${secret}`)
    : `${content.trimEnd()}\n${SECRET_KEY}=${secret}\n`;
  fs.writeFileSync(envPath, updated, 'utf8');
  return true;
}

/** Devolve a chave de 32 bytes usada na criptografia AES-256-GCM. */
export function getSecretKey(): Buffer {
  const value = process.env[SECRET_KEY];
  if (!value) {
    throw new Error('POLARIS_SECRET não encontrado. Reinicie o servidor para gerar a chave.');
  }
  const key = Buffer.from(value, 'base64');
  if (key.length !== 32) {
    throw new Error('POLARIS_SECRET inválido: precisa ter 32 bytes em base64.');
  }
  return key;
}
