import type { ModalityId } from '@polaris/shared';
import { useNavigate } from 'react-router';
import { useStartSession } from './api';

/** Inicia um treino de força (de uma ficha ou livre, na modalidade escolhida) e abre a tela da sessão. */
export function useBeginWorkout() {
  const start = useStartSession();
  const navigate = useNavigate();
  return {
    begin: async (routineId: string | null, modality?: ModalityId) => {
      const session = await start.mutateAsync({ routineId, modality });
      navigate(`/academia/treino/${session.id}`);
    },
    pending: start.isPending,
  };
}
