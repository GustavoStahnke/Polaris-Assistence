import { useNavigate } from 'react-router';
import { useStartSession } from './api';

/** Inicia um treino (de uma ficha ou livre) e abre a tela da sessão. */
export function useBeginWorkout() {
  const start = useStartSession();
  const navigate = useNavigate();
  return {
    begin: async (routineId: string | null) => {
      const session = await start.mutateAsync(routineId);
      navigate(`/academia/treino/${session.id}`);
    },
    pending: start.isPending,
  };
}
