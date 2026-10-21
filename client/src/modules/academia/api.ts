import {
  getModality,
  MODALITY_IDS,
  MODALITY_LIST,
  type ActivityInput,
  type ActivityLogResult,
  type BodyMeasurement,
  type BodyMeasurementInput,
  type Exercise,
  type ExerciseInput,
  type ExerciseProgress,
  type FinishSessionResult,
  type FitnessSettings,
  type Modality,
  type ModalityId,
  type ModalityStats,
  type PersonalRecord,
  type Routine,
  type RoutineInput,
  type TodayWorkout,
  type WorkoutSession,
  type WorkoutSessionSummary,
} from '@polaris/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { api, errorMessage } from '../../lib/api';
import { toast } from '../../stores/toastStore';

const GYM = ['gym'] as const;

export const useFitnessSettings = () =>
  useQuery({ queryKey: [...GYM, 'settings'], queryFn: () => api.get<FitnessSettings>('/gym/settings') });

/** Modalidades que o usuário pratica, na ordem do catálogo (todas, enquanto carrega). */
export function useEnabledModalities(): Modality[] {
  const settings = useFitnessSettings();
  return useMemo(() => {
    const enabled = new Set<string>(settings.data?.modalities ?? MODALITY_IDS);
    return MODALITY_LIST.filter((m) => enabled.has(m.id));
  }, [settings.data]);
}

export const useModalityStats = (modality: ModalityId | null) =>
  useQuery({
    queryKey: [...GYM, 'stats', modality],
    queryFn: () => api.get<ModalityStats>(`/gym/modalities/${modality}/stats`),
    enabled: Boolean(modality) && getModality(modality).kind !== 'forca',
  });

export const useExercises = () =>
  useQuery({ queryKey: [...GYM, 'exercises'], queryFn: () => api.get<Exercise[]>('/gym/exercises') });
export const useRoutines = () =>
  useQuery({ queryKey: [...GYM, 'routines'], queryFn: () => api.get<Routine[]>('/gym/routines') });
export const useTodayWorkout = () =>
  useQuery({ queryKey: [...GYM, 'today'], queryFn: () => api.get<TodayWorkout>('/gym/today') });
export const useSessions = () =>
  useQuery({
    queryKey: [...GYM, 'sessions'],
    queryFn: () => api.get<WorkoutSessionSummary[]>('/gym/sessions'),
  });
export const useRecords = () =>
  useQuery({ queryKey: [...GYM, 'records'], queryFn: () => api.get<PersonalRecord[]>('/gym/records') });
export const useMeasurements = () =>
  useQuery({
    queryKey: [...GYM, 'measurements'],
    queryFn: () => api.get<BodyMeasurement[]>('/gym/measurements'),
  });

export const useProgress = (exerciseId: string | null) =>
  useQuery({
    queryKey: [...GYM, 'progress', exerciseId],
    queryFn: () => api.get<ExerciseProgress>(`/gym/progress/${exerciseId}`),
    enabled: Boolean(exerciseId),
  });

export const useSession = (id: string | undefined) =>
  useQuery({
    queryKey: [...GYM, 'session', id],
    queryFn: () => api.get<{ session: WorkoutSession; records: PersonalRecord[] }>(`/gym/sessions/${id}`),
    enabled: Boolean(id),
  });

/** Mutação padrão da Academia: recarrega os dados e avisa em caso de erro. */
function useGymMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>, successMessage?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: GYM });
      void queryClient.invalidateQueries({ queryKey: ['habits'] });
      if (successMessage) toast.success(successMessage);
    },
    onError: (error) => toast.error('Não deu certo', errorMessage(error)),
  });
}

export const useSaveRoutine = () =>
  useGymMutation(
    ({ id, ...input }: RoutineInput & { id?: string }) =>
      id ? api.put<Routine>(`/gym/routines/${id}`, input) : api.post<Routine>('/gym/routines', input),
    'Ficha salva',
  );
export const useDeleteRoutine = () =>
  useGymMutation((id: string) => api.delete(`/gym/routines/${id}`), 'Ficha apagada');

export const useSaveFitnessSettings = () =>
  useGymMutation((input: FitnessSettings) => api.put<FitnessSettings>('/gym/settings', input));

export const useStartSession = () =>
  useGymMutation((input: { routineId: string | null; modality?: ModalityId }) =>
    api.post<WorkoutSession>('/gym/sessions', input),
  );
export const useDeleteSession = () => useGymMutation((id: string) => api.delete(`/gym/sessions/${id}`));

/** Registra (ou corrige) um treino de corrida, caminhada ou luta. */
export const useSaveActivity = () =>
  useGymMutation(({ id, ...input }: ActivityInput & { id?: string }) =>
    id
      ? api.put<ActivityLogResult>(`/gym/activities/${id}`, input)
      : api.post<ActivityLogResult>('/gym/activities', input),
  );
export const useFinishSession = () =>
  useGymMutation(({ id, notes }: { id: string; notes?: string }) =>
    api.post<FinishSessionResult>(`/gym/sessions/${id}/finish`, { notes }),
  );

export function useSetMutations(sessionId: string) {
  const queryClient = useQueryClient();
  const key = [...GYM, 'session', sessionId];
  const apply = (session: WorkoutSession) =>
    queryClient.setQueryData(
      key,
      (old: { session: WorkoutSession; records: PersonalRecord[] } | undefined) => ({
        records: old?.records ?? [],
        session,
      }),
    );
  const onError = (error: unknown) => toast.error('Não foi possível salvar a série', errorMessage(error));
  return {
    update: useMutation({
      mutationFn: ({ id, ...patch }: { id: string; weight?: number; reps?: number; done?: boolean }) =>
        api.patch<WorkoutSession>(`/gym/sets/${id}`, patch),
      onSuccess: apply,
      onError,
    }),
    add: useMutation({
      mutationFn: (exerciseId: string) =>
        api.post<WorkoutSession>(`/gym/sessions/${sessionId}/sets`, { exerciseId }),
      onSuccess: apply,
      onError,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.delete<WorkoutSession>(`/gym/sets/${id}`),
      onSuccess: apply,
      onError,
    }),
  };
}

export const useCreateExercise = () =>
  useGymMutation((input: ExerciseInput) => api.post<Exercise>('/gym/exercises', input), 'Exercício criado');
export const useDeleteExercise = () =>
  useGymMutation((id: string) => api.delete(`/gym/exercises/${id}`), 'Exercício apagado');

export const useCreateMeasurement = () =>
  useGymMutation(
    (input: BodyMeasurementInput) => api.post<BodyMeasurement>('/gym/measurements', input),
    'Medidas salvas',
  );
export const useDeleteMeasurement = () =>
  useGymMutation((id: string) => api.delete(`/gym/measurements/${id}`));
