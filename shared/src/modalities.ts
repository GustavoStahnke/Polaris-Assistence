import { z } from 'zod';

// Modalidades de treino do módulo Treino.
// Para adicionar uma modalidade nova, basta incluir um item em MODALITIES
// (e, se ela for de força e tiver exercícios próprios, alguns no seed do servidor).

/**
 * Como cada modalidade é registrada:
 * - forca: fichas com exercícios e séries (carga × repetições);
 * - distancia: distância, tempo e pace;
 * - sessao: aulas e lutas, com duração, rounds e intensidade.
 */
export const MODALITY_KINDS = ['forca', 'distancia', 'sessao'] as const;
export type ModalityKind = (typeof MODALITY_KINDS)[number];
export const MODALITY_KIND_LABELS: Record<ModalityKind, string> = {
  forca: 'Força',
  distancia: 'Cardio',
  sessao: 'Lutas e aulas',
};

export interface ModalityDefinition<Id extends string = string> {
  id: Id;
  name: string;
  kind: ModalityKind;
  /** Nome do ícone lucide. */
  icon: string;
  /** Uma frase em pt-BR. */
  description: string;
  /** Tipos de treino oferecidos no registro (distância e sessão). */
  sessionTypes: readonly string[];
  /** Força: nome do peso na série ("Carga" na academia, "Lastro" na calistenia). */
  weightLabel?: string;
  /** Força: o resumo do treino mostra o volume em kg ou o total de repetições. */
  volumeUnit?: 'kg' | 'reps';
  /** Sessão: como chamar os rounds ("Rounds", "Rolas"). */
  roundsLabel?: string;
}

export const MODALITIES = [
  {
    id: 'academia',
    name: 'Academia',
    kind: 'forca',
    icon: 'Dumbbell',
    description: 'Musculação com fichas, séries, cargas e recordes pessoais.',
    sessionTypes: [],
    weightLabel: 'Carga',
    volumeUnit: 'kg',
  },
  {
    id: 'calistenia',
    name: 'Calistenia',
    kind: 'forca',
    icon: 'PersonStanding',
    description: 'Peso do corpo: repetições, isometrias em segundos e lastro opcional.',
    sessionTypes: [],
    weightLabel: 'Lastro',
    volumeUnit: 'reps',
  },
  {
    id: 'corrida',
    name: 'Corrida',
    kind: 'distancia',
    icon: 'Footprints',
    description: 'Distância, tempo e pace de cada corrida, com recordes e km por semana.',
    sessionTypes: ['Rodagem leve', 'Longão', 'Intervalado', 'Ritmo forte', 'Esteira', 'Prova'],
  },
  {
    id: 'caminhada',
    name: 'Caminhada',
    kind: 'distancia',
    icon: 'Route',
    description: 'Caminhadas e trilhas, com distância, tempo e ritmo.',
    sessionTypes: ['Caminhada leve', 'Caminhada rápida', 'Trilha', 'Esteira'],
  },
  {
    id: 'muay_thai',
    name: 'Muay Thai',
    kind: 'sessao',
    icon: 'HandFist',
    description: 'Aulas, sparring e saco: duração, rounds, intensidade e técnicas.',
    sessionTypes: ['Aula', 'Técnica', 'Saco e manopla', 'Sparring', 'Condicionamento', 'Competição'],
    roundsLabel: 'Rounds',
  },
  {
    id: 'jiu_jitsu',
    name: 'Jiu-Jitsu',
    kind: 'sessao',
    icon: 'Swords',
    description: 'Aulas com e sem kimono, rolas, intensidade e o que você aprendeu.',
    sessionTypes: ['Aula com kimono', 'Aula sem kimono', 'Drills', 'Open mat', 'Competição'],
    roundsLabel: 'Rolas',
  },
] as const satisfies readonly ModalityDefinition[];

export type ModalityId = (typeof MODALITIES)[number]['id'];
/** Uma modalidade do catálogo. */
export type Modality = ModalityDefinition<ModalityId>;
export const MODALITY_LIST: readonly Modality[] = MODALITIES;
export const MODALITY_IDS = MODALITIES.map((m) => m.id) as [ModalityId, ...ModalityId[]];
export const modalityIdSchema = z.enum(MODALITY_IDS);

/** Definição da modalidade pelo id (se o id não existir mais, cai na Academia). */
export const getModality = (id: string | null | undefined): Modality =>
  MODALITY_LIST.find((m) => m.id === id) ?? MODALITIES[0];

export const isStrengthModality = (id: string | null | undefined) => getModality(id).kind === 'forca';

/** Modalidades que o usuário pratica (Treino > Modalidades). */
export const fitnessSettingsSchema = z.object({
  modalities: z.array(modalityIdSchema).min(1, 'Escolha pelo menos uma modalidade.'),
});
export type FitnessSettings = z.infer<typeof fitnessSettingsSchema>;
export const DEFAULT_FITNESS_SETTINGS: FitnessSettings = { modalities: [...MODALITY_IDS] };

/** 330 segundos por km → "5:30" */
export function formatPace(secondsPerKm: number): string {
  const total = Math.round(secondsPerKm);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Pace em segundos por km (null sem distância). */
export const paceOf = (durationSeconds: number, distanceKm: number | null | undefined) =>
  distanceKm && distanceKm > 0 ? durationSeconds / distanceKm : null;
