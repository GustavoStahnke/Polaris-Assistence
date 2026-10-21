import {
  networkUpdateSchema,
  pinLoginSchema,
  type NetworkAddress,
  type NetworkStatus,
} from '@polaris/shared';
import os from 'node:os';
import QRCode from 'qrcode';
import { badRequest, HttpError, parseInput } from '../lib/http';
import { getSetting, setSetting } from '../repositories/settingsRepository';
import { createSessionToken, hashPin, verifyPin, verifySessionToken } from '../security/pin';
import { getListeningHost, getPort, rebind } from '../serverControl';

interface NetworkSettings {
  enabled: boolean;
  pinHash: string | null;
  /** Momento da última troca de PIN (sessões anteriores deixam de valer). */
  pinChangedAt: number;
}

const DEFAULTS: NetworkSettings = { enabled: false, pinHash: null, pinChangedAt: 0 };

export const getNetworkSettings = (): NetworkSettings => ({
  ...DEFAULTS,
  ...getSetting<NetworkSettings>('network'),
});

/** Endereços IPv4 da rede local (Wi-Fi/cabo) deste computador. */
export function localAddresses(port: number = getPort()): NetworkAddress[] {
  const list: NetworkAddress[] = [];
  for (const [name, entries] of Object.entries(os.networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family === 'IPv4' && !entry.internal) {
        list.push({ name, address: entry.address, url: `http://${entry.address}:${port}` });
      }
    }
  }
  // Redes domésticas comuns primeiro (192.168.x / 10.x).
  return list.sort(
    (a, b) => Number(b.address.startsWith('192.168.')) - Number(a.address.startsWith('192.168.')),
  );
}

export function getNetworkStatus(isLocal: boolean): NetworkStatus {
  const settings = getNetworkSettings();
  return {
    enabled: settings.enabled,
    hasPin: Boolean(settings.pinHash),
    port: getPort(),
    listeningOn: getListeningHost(),
    addresses: localAddresses(),
    isLocal,
  };
}

/** Liga/desliga o modo rede local (só pelo próprio computador). Exige PIN para ligar. */
export async function updateNetwork(
  input: unknown,
  isLocal: boolean,
  now: Date = new Date(),
): Promise<NetworkStatus> {
  if (!isLocal) throw new HttpError(403, 'FORBIDDEN', 'Só dá para mudar isso no próprio computador.');
  const data = parseInput(networkUpdateSchema, input);
  const settings = getNetworkSettings();
  const next: NetworkSettings = { ...settings, enabled: data.enabled };
  if (data.pin) {
    next.pinHash = hashPin(data.pin);
    next.pinChangedAt = now.getTime();
  }
  if (next.enabled && !next.pinHash)
    throw badRequest('Defina um PIN (4 a 8 números) para ligar o modo rede local.');
  setSetting('network', next);
  // Responde primeiro e troca o endereço logo depois (a troca fecha as conexões abertas).
  setTimeout(() => void rebind(next.enabled ? '0.0.0.0' : process.env.HOST || '127.0.0.1'), 300);
  return { ...getNetworkStatus(isLocal), enabled: next.enabled, hasPin: Boolean(next.pinHash) };
}

/** Host em que o servidor deve escutar ao iniciar. */
export const startupHost = (envHost: string) => (getNetworkSettings().enabled ? '0.0.0.0' : envHost);

/** QR code (SVG) com o endereço para abrir no celular. */
export async function qrCodeSvg(url: string): Promise<string> {
  if (!/^http:\/\/[\d.]+:\d+$/.test(url)) throw badRequest('Endereço inválido.');
  return QRCode.toString(url, { type: 'svg', margin: 1, color: { dark: '#030814', light: '#E6F0FF' } });
}

// ===== Login por PIN (com limite de tentativas) =====

const attempts = new Map<string, { count: number; first: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000;

export function loginWithPin(input: unknown, ip: string, now: Date = new Date()): string {
  const entry = attempts.get(ip);
  if (entry && now.getTime() - entry.first < WINDOW_MS && entry.count >= MAX_ATTEMPTS) {
    throw new HttpError(429, 'TOO_MANY_ATTEMPTS', 'Muitas tentativas. Espere um minuto e tente de novo.');
  }
  const { pin } = parseInput(pinLoginSchema, input);
  if (!verifyPin(pin, getNetworkSettings().pinHash)) {
    const fresh = !entry || now.getTime() - entry.first >= WINDOW_MS;
    attempts.set(ip, { count: fresh ? 1 : entry.count + 1, first: fresh ? now.getTime() : entry.first });
    throw new HttpError(401, 'WRONG_PIN', 'PIN incorreto.');
  }
  attempts.delete(ip);
  return createSessionToken(now);
}

export const isSessionValid = (token: string | undefined) =>
  verifySessionToken(token, getNetworkSettings().pinChangedAt);
