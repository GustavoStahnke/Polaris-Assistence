import { z } from 'zod';

export interface NetworkAddress {
  name: string;
  address: string;
  url: string;
}

export interface NetworkStatus {
  enabled: boolean;
  hasPin: boolean;
  port: number;
  listeningOn: string;
  addresses: NetworkAddress[];
  /** true quando quem pergunta é o próprio computador (só ele pode mudar a configuração). */
  isLocal: boolean;
}

export const networkUpdateSchema = z.object({
  enabled: z.boolean(),
  pin: z
    .string()
    .regex(/^\d{4,8}$/, 'O PIN deve ter de 4 a 8 números.')
    .optional(),
});

export const pinLoginSchema = z.object({ pin: z.string().regex(/^\d{4,8}$/, 'PIN inválido.') });

export interface AuthStatus {
  /** Este acesso precisa de PIN (veio de outro aparelho da rede). */
  required: boolean;
  authenticated: boolean;
}
