import { WEEKDAY_LABELS, type Routine } from '@polaris/shared';
import { CheckCircle2, Dumbbell, Play, Timer, Zap } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { formatDuration, formatNumber, formatRelative } from '../../lib/format';
import { useRoutines, useTodayWorkout } from './api';
import { useBeginWorkout } from './useBeginWorkout';

export function TodayTab() {
  const today = useTodayWorkout();
  const routines = useRoutines();
  const { begin, pending } = useBeginWorkout();
  const navigate = useNavigate();
  const data = today.data;
  const others = (routines.data ?? []).filter((r) => !data?.planned.some((p) => p.id === r.id));

  if (today.isPending) return <PolarisCard label="Treino · Hoje" state="loading" />;

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        {data?.activeSession && (
          <PolarisCard
            icon={Timer}
            label="Treino · Em andamento"
            title={data.activeSession.routineName ?? 'Treino'}
            badge={<Badge tone="warning">Ativo</Badge>}
          >
            <p className="text-sm text-text-dim">
              Começou {formatRelative(data.activeSession.startedAt)} ·{' '}
              {data.activeSession.sets.filter((s) => s.done).length} de {data.activeSession.sets.length}{' '}
              séries feitas
            </p>
            <Button
              className="mt-4"
              variant="primary"
              icon={Play}
              onClick={() => navigate(`/academia/treino/${data.activeSession!.id}`)}
            >
              Continuar treino
            </Button>
          </PolarisCard>
        )}

        {data?.doneToday && (
          <PolarisCard
            icon={CheckCircle2}
            label="Treino · Concluído hoje"
            title={data.doneToday.routineName ?? 'Treino'}
            badge={<Badge tone="success">Feito</Badge>}
          >
            <p className="text-sm text-text-dim">
              {formatDuration(data.doneToday.durationSeconds ?? 0)} ·{' '}
              {formatNumber(data.doneToday.totalVolume ?? 0)} kg de volume · {data.doneToday.sets} séries
              {data.doneToday.records > 0 && ` · ${data.doneToday.records} recorde(s)`}
            </p>
          </PolarisCard>
        )}

        {data && !data.activeSession && data.planned.length === 0 && (
          <PolarisCard icon={Dumbbell} label="Treino · Hoje" title="Dia de descanso">
            <EmptyState
              compact
              title="Nenhuma ficha planejada para hoje"
              message="Descansar também faz parte do treino. Se quiser treinar mesmo assim, escolha uma ficha ou faça um treino livre."
              action={
                <Button variant="primary" icon={Zap} loading={pending} onClick={() => void begin(null)}>
                  Treino livre
                </Button>
              }
            />
          </PolarisCard>
        )}

        {!data?.activeSession &&
          data?.planned.map((routine) => (
            <RoutineStartCard
              key={routine.id}
              routine={routine}
              planned
              onStart={() => void begin(routine.id)}
              pending={pending}
            />
          ))}

        {!data?.activeSession && others.length > 0 && (
          <div>
            <p className="label-mono mb-3 text-text-dim">Outras fichas</p>
            <div className="grid gap-4 md:grid-cols-2">
              {others.map((routine) => (
                <RoutineStartCard
                  key={routine.id}
                  routine={routine}
                  onStart={() => void begin(routine.id)}
                  pending={pending}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <PolarisCard icon={Zap} label="Treino · Semana" title="Seu ritmo">
        <p className="font-display text-4xl font-bold text-star glow-text">{data?.weekCount ?? 0}</p>
        <p className="text-sm text-text-dim">treinos nesta semana</p>
        {data?.lastSession && (
          <p className="mt-4 text-sm text-text-dim">
            Último: <span className="text-text">{data.lastSession.routineName}</span>{' '}
            {formatRelative(data.lastSession.startedAt)}
          </p>
        )}
      </PolarisCard>
    </div>
  );
}

function RoutineStartCard({
  routine,
  planned,
  onStart,
  pending,
}: {
  routine: Routine;
  planned?: boolean;
  onStart: () => void;
  pending: boolean;
}) {
  return (
    <PolarisCard
      icon={Dumbbell}
      label={planned ? 'Treino · Planejado para hoje' : 'Treino · Ficha'}
      title={routine.name}
      badge={
        <span className="flex gap-1">
          {routine.weekdays.map((d) => (
            <Badge key={d} tone={planned ? 'primary' : 'muted'}>
              {WEEKDAY_LABELS[d]}
            </Badge>
          ))}
        </span>
      }
    >
      <ul className="space-y-1.5 text-sm">
        {routine.exercises.map((e) => (
          <li key={e.id} className="flex justify-between gap-3">
            <span>{e.exerciseName}</span>
            <span className="font-mono text-text-dim">
              {e.targetSets}×{e.targetReps}
              {e.targetWeight ? ` · ${e.targetWeight}kg` : ''}
            </span>
          </li>
        ))}
        {routine.exercises.length === 0 && <li className="text-text-dim">Ficha sem exercícios ainda.</li>}
      </ul>
      <Button
        className="mt-4"
        variant={planned ? 'primary' : 'outline'}
        icon={Play}
        loading={pending}
        onClick={onStart}
      >
        Iniciar treino
      </Button>
    </PolarisCard>
  );
}
