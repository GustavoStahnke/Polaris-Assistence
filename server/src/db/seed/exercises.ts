import type { ExerciseMeasure, ModalityId } from '@polaris/shared';

interface SeedExercise {
  name: string;
  muscleGroup: string;
  equipment: string;
  measure?: ExerciseMeasure;
}

// Exercícios mais comuns, em português, para o catálogo inicial da Academia.
const ACADEMIA: SeedExercise[] = [
  { name: 'Supino reto', muscleGroup: 'Peito', equipment: 'Barra' },
  { name: 'Supino inclinado com halteres', muscleGroup: 'Peito', equipment: 'Halteres' },
  { name: 'Supino declinado', muscleGroup: 'Peito', equipment: 'Barra' },
  { name: 'Crucifixo reto', muscleGroup: 'Peito', equipment: 'Halteres' },
  { name: 'Crossover', muscleGroup: 'Peito', equipment: 'Polia' },
  { name: 'Peck deck', muscleGroup: 'Peito', equipment: 'Máquina' },
  { name: 'Flexão de braço', muscleGroup: 'Peito', equipment: 'Peso corporal' },
  { name: 'Puxada frontal', muscleGroup: 'Costas', equipment: 'Polia' },
  { name: 'Barra fixa', muscleGroup: 'Costas', equipment: 'Peso corporal' },
  { name: 'Remada curvada', muscleGroup: 'Costas', equipment: 'Barra' },
  { name: 'Remada baixa', muscleGroup: 'Costas', equipment: 'Polia' },
  { name: 'Remada unilateral', muscleGroup: 'Costas', equipment: 'Halteres' },
  { name: 'Pulldown com braços estendidos', muscleGroup: 'Costas', equipment: 'Polia' },
  { name: 'Levantamento terra', muscleGroup: 'Costas', equipment: 'Barra' },
  { name: 'Desenvolvimento com halteres', muscleGroup: 'Ombros', equipment: 'Halteres' },
  { name: 'Desenvolvimento militar', muscleGroup: 'Ombros', equipment: 'Barra' },
  { name: 'Elevação lateral', muscleGroup: 'Ombros', equipment: 'Halteres' },
  { name: 'Elevação frontal', muscleGroup: 'Ombros', equipment: 'Halteres' },
  { name: 'Crucifixo inverso', muscleGroup: 'Ombros', equipment: 'Halteres' },
  { name: 'Encolhimento', muscleGroup: 'Ombros', equipment: 'Halteres' },
  { name: 'Rosca direta', muscleGroup: 'Bíceps', equipment: 'Barra' },
  { name: 'Rosca alternada', muscleGroup: 'Bíceps', equipment: 'Halteres' },
  { name: 'Rosca martelo', muscleGroup: 'Bíceps', equipment: 'Halteres' },
  { name: 'Rosca Scott', muscleGroup: 'Bíceps', equipment: 'Máquina' },
  { name: 'Rosca concentrada', muscleGroup: 'Bíceps', equipment: 'Halteres' },
  { name: 'Tríceps pulley', muscleGroup: 'Tríceps', equipment: 'Polia' },
  { name: 'Tríceps corda', muscleGroup: 'Tríceps', equipment: 'Polia' },
  { name: 'Tríceps testa', muscleGroup: 'Tríceps', equipment: 'Barra' },
  { name: 'Tríceps francês', muscleGroup: 'Tríceps', equipment: 'Halteres' },
  { name: 'Mergulho nas paralelas', muscleGroup: 'Tríceps', equipment: 'Peso corporal' },
  { name: 'Agachamento livre', muscleGroup: 'Pernas', equipment: 'Barra' },
  { name: 'Leg press 45°', muscleGroup: 'Pernas', equipment: 'Máquina' },
  { name: 'Cadeira extensora', muscleGroup: 'Pernas', equipment: 'Máquina' },
  { name: 'Mesa flexora', muscleGroup: 'Pernas', equipment: 'Máquina' },
  { name: 'Afundo', muscleGroup: 'Pernas', equipment: 'Halteres' },
  { name: 'Agachamento búlgaro', muscleGroup: 'Pernas', equipment: 'Halteres' },
  { name: 'Stiff', muscleGroup: 'Pernas', equipment: 'Barra' },
  { name: 'Cadeira adutora', muscleGroup: 'Pernas', equipment: 'Máquina' },
  { name: 'Cadeira abdutora', muscleGroup: 'Glúteos', equipment: 'Máquina' },
  { name: 'Elevação pélvica', muscleGroup: 'Glúteos', equipment: 'Barra' },
  { name: 'Panturrilha em pé', muscleGroup: 'Panturrilha', equipment: 'Máquina' },
  { name: 'Panturrilha sentado', muscleGroup: 'Panturrilha', equipment: 'Máquina' },
  { name: 'Abdominal supra', muscleGroup: 'Abdômen', equipment: 'Peso corporal' },
  { name: 'Abdominal infra', muscleGroup: 'Abdômen', equipment: 'Peso corporal' },
  { name: 'Prancha', muscleGroup: 'Abdômen', equipment: 'Peso corporal' },
  { name: 'Abdominal na polia', muscleGroup: 'Abdômen', equipment: 'Polia' },
  { name: 'Esteira', muscleGroup: 'Cardio', equipment: 'Máquina' },
  { name: 'Bicicleta ergométrica', muscleGroup: 'Cardio', equipment: 'Máquina' },
  { name: 'Elíptico', muscleGroup: 'Cardio', equipment: 'Máquina' },
  { name: 'Pular corda', muscleGroup: 'Cardio', equipment: 'Outro' },
];

// Calistenia: peso do corpo. Isometrias (prancha, L-sit...) são medidas em segundos.
const CALISTENIA: SeedExercise[] = [
  { name: 'Flexão de braço', muscleGroup: 'Peito', equipment: 'Peso corporal' },
  { name: 'Flexão arqueiro', muscleGroup: 'Peito', equipment: 'Peso corporal' },
  { name: 'Flexão diamante', muscleGroup: 'Tríceps', equipment: 'Peso corporal' },
  { name: 'Flexão pike', muscleGroup: 'Ombros', equipment: 'Peso corporal' },
  { name: 'Flexão em parada de mão', muscleGroup: 'Ombros', equipment: 'Peso corporal' },
  { name: 'Barra fixa pronada', muscleGroup: 'Costas', equipment: 'Barra fixa' },
  { name: 'Barra fixa supinada', muscleGroup: 'Bíceps', equipment: 'Barra fixa' },
  { name: 'Remada australiana', muscleGroup: 'Costas', equipment: 'Barra fixa' },
  { name: 'Muscle-up', muscleGroup: 'Corpo inteiro', equipment: 'Barra fixa' },
  { name: 'Mergulho nas paralelas', muscleGroup: 'Tríceps', equipment: 'Paralelas' },
  { name: 'Mergulho no banco', muscleGroup: 'Tríceps', equipment: 'Peso corporal' },
  { name: 'Agachamento livre', muscleGroup: 'Pernas', equipment: 'Peso corporal' },
  { name: 'Agachamento pistol', muscleGroup: 'Pernas', equipment: 'Peso corporal' },
  { name: 'Afundo alternado', muscleGroup: 'Pernas', equipment: 'Peso corporal' },
  { name: 'Panturrilha unilateral', muscleGroup: 'Panturrilha', equipment: 'Peso corporal' },
  { name: 'Elevação de pernas na barra', muscleGroup: 'Abdômen', equipment: 'Barra fixa' },
  { name: 'Burpee', muscleGroup: 'Corpo inteiro', equipment: 'Peso corporal' },
  { name: 'Prancha', muscleGroup: 'Abdômen', equipment: 'Peso corporal', measure: 'tempo' },
  { name: 'Hollow body', muscleGroup: 'Abdômen', equipment: 'Peso corporal', measure: 'tempo' },
  { name: 'L-sit', muscleGroup: 'Abdômen', equipment: 'Paralelas', measure: 'tempo' },
  { name: 'Parada de mão na parede', muscleGroup: 'Ombros', equipment: 'Peso corporal', measure: 'tempo' },
  { name: 'Front lever grupado', muscleGroup: 'Costas', equipment: 'Barra fixa', measure: 'tempo' },
];

/** Catálogo inicial por modalidade de força. */
export const SEED_EXERCISES: Partial<Record<ModalityId, SeedExercise[]>> = {
  academia: ACADEMIA,
  calistenia: CALISTENIA,
};
