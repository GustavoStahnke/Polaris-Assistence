import { z } from 'zod';

/** Perfil do usuário (Configurações > Perfil). */
export const profileSchema = z.object({
  name: z.string().trim().max(60, 'Use até 60 caracteres.'),
  /** Como a Polaris chama o usuário (ex.: apelido). Se vazio, usa o nome. */
  callName: z.string().trim().max(60, 'Use até 60 caracteres.'),
  city: z.string().trim().max(80).default(''),
});
export type Profile = z.infer<typeof profileSchema>;

/** Nome usado nas saudações. */
export const displayName = (profile: Pick<Profile, 'name' | 'callName'> | undefined) =>
  profile?.callName || profile?.name.split(' ')[0] || '';
