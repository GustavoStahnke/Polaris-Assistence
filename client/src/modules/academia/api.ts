import type {
  BodyMeasurement,
  BodyMeasurementInput,
  Exercise,
  ExerciseInput,
  ExerciseProgress,
  FinishSessionResult,
  PersonalRecord,
  Routine,
  RoutineInput,
  TodayWorkout,
  WorkoutSession,
  WorkoutSessionSummary,
} from '@polaris/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '../../lib/api';
import { toast } from '../../stores/toastStore';

const GYM = ['gym'] as const;

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

export const useStartSession = () =>
  useGymMutation((routineId: string | null) => api.post<WorkoutSession>('/gym/sessions', { routineId }));
export const useDeleteSession = () => useGymMutation((id: string) => api.delete(`/gym/sessions/${id}`));
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
