import { Dumbbell, Play } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { formatDuration, formatNumber } from '../../lib/format';
import { useTodayWorkout } from './api';
import { useBeginWorkout } from './useBeginWorkout';

/** Card "Treino de hoje" do Painel. */
export function WorkoutTodayCard({ index, className }: { index?: number; className?: string }) {
  const today = useTodayWorkout();
  const { begin, pending } = useBeginWorkout();
  const navigate = useNavigate();
  const data = today.data;
  const planned = data?.planned[0];

  const state = today.isPending ? 'loading' : today.isError ? 'error' : 'ready';
  const title = data?.activeSession
    ? (data.activeSession.routineName ?? 'Treino em andamento')
    : data?.doneToday
      ? 'Treino concluído'
      : (planned?.name ?? 'Dia de descanso');

  return (
    <PolarisCard
      index={index}
      className={className}
      icon={Dumbbell}
      label="Treino · Hoje"
      title={title}
      badge={
        data?.activeSession ? (
          <Badge tone="warning">Em andamento</Badge>
        ) : data?.doneToday ? (
          <Badge tone="success">Feito</Badge>
        ) : undefined
      }
      state={state}
      errorMessage="Não foi possível carregar o treino."
      footer={data ? `${data.weekCount} treino(s) nesta semana` : undefined}
      to="/academia"
    >
      {data?.activeSession ? (
        <Button
          variant="primary"
          icon={Play}
          onClick={() => navigate(`/academia/treino/${data.activeSession!.id}`)}
        >
          Continuar treino
        </Button>
      ) : data?.doneToday ? (
        <p className="text-sm text-text-dim">
          {data.doneToday.routineName} · {formatDuration(data.doneToday.durationSeconds ?? 0)} ·{' '}
          {formatNumber(data.doneToday.totalVolume ?? 0)} kg
          {data.doneToday.records > 0 && ` · ${data.doneToday.records} recorde(s) 🏆`}
        </p>
      ) : planned ? (
        <>
          <ul className="mb-4 space-y-1 text-sm">
            {planned.exercises.slice(0, 4).map((e) => (
              <li key={e.id} className="flex justify-between gap-2">
                <span className="truncate">{e.exerciseName}</span>
                <span className="font-mono text-text-dim">
                  {e.targetSets}×{e.targetReps}
                </span>
              </li>
            ))}
            {planned.exercises.length > 4 && (
              <li className="text-text-dim">+ {planned.exercises.length - 4} exercício(s)</li>
            )}
          </ul>
          <Button variant="primary" icon={Play} loading={pending} onClick={() => void begin(planned.id)}>
            Iniciar treino
          </Button>
        </>
      ) : (
        <>
          <p className="mb-4 text-sm text-text-dim">
            Nenhuma ficha para hoje. Descanse ou faça um treino livre.
          </p>
          <Button icon={Play} loading={pending} onClick={() => void begin(null)}>
            Treino livre
          </Button>
        </>
      )}
    </PolarisCard>
  );
}
