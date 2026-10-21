import { getModality } from '@polaris/shared';
import { ClipboardPen, Dumbbell, Play } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { plural } from '../../lib/format';
import { ActivityLogModal, type ActivityTarget } from './ActivityLogModal';
import { useEnabledModalities, useTodayWorkout } from './api';
import { modalityIcon, planTargets, sessionHighlights } from './modality';
import { useBeginWorkout } from './useBeginWorkout';

/** Card "Treino de hoje" do Painel. */
export function WorkoutTodayCard({ index, className }: { index?: number; className?: string }) {
  const today = useTodayWorkout();
  const modalities = useEnabledModalities();
  const { begin, pending } = useBeginWorkout();
  const navigate = useNavigate();
  const [logTarget, setLogTarget] = useState<ActivityTarget | null>(null);
  const data = today.data;
  const active = data?.activeSession;
  const planned = data?.planned[0];
  const done = data?.doneToday ?? [];
  const firstStrength = modalities.find((m) => m.kind === 'forca');

  const state = today.isPending ? 'loading' : today.isError ? 'error' : 'ready';
  const title = active
    ? (active.routineName ?? 'Treino em andamento')
    : planned
      ? planned.name
      : done.length
        ? 'Treino concluído'
        : 'Dia de descanso';
  const iconModality = active?.modality ?? planned?.modality ?? done[0]?.modality;

  return (
    <PolarisCard
      index={index}
      className={className}
      icon={iconModality ? modalityIcon(iconModality) : Dumbbell}
      label={planned && !active ? `Treino · ${getModality(planned.modality).name}` : 'Treino · Hoje'}
      title={title}
      badge={
        active ? (
          <Badge tone="warning">Em andamento</Badge>
        ) : done.length ? (
          <Badge tone="success">{planned ? plural(done.length, 'feito') : 'Feito'}</Badge>
        ) : undefined
      }
      state={state}
      errorMessage="Não foi possível carregar o treino."
      footer={data ? `${plural(data.weekCount, 'treino')} nesta semana` : undefined}
      to="/academia"
    >
      {active ? (
        <Button variant="primary" icon={Play} onClick={() => navigate(`/academia/treino/${active.id}`)}>
          Continuar treino
        </Button>
      ) : planned ? (
        <>
          {getModality(planned.modality).kind === 'forca' ? (
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
          ) : (
            <p className="mb-4 font-mono text-sm text-text-dim">
              {planTargets(planned) || getModality(planned.modality).name}
            </p>
          )}
          {getModality(planned.modality).kind === 'forca' ? (
            <Button variant="primary" icon={Play} loading={pending} onClick={() => void begin(planned.id)}>
              Iniciar treino
            </Button>
          ) : (
            <Button
              variant="primary"
              icon={ClipboardPen}
              onClick={() => setLogTarget({ modality: planned.modality, plan: planned })}
            >
              Registrar treino
            </Button>
          )}
          {(data?.planned.length ?? 0) > 1 && (
            <p className="mt-3 text-xs text-text-dim">
              + {plural(data!.planned.length - 1, 'outro treino', 'outros treinos')} planejado(s) hoje
            </p>
          )}
        </>
      ) : done.length ? (
        <ul className="space-y-1.5 text-sm">
          {done.slice(0, 3).map((s) => (
            <li key={s.id}>
              <span className="text-text">{s.routineName ?? getModality(s.modality).name}</span>
              <span className="text-text-dim"> · {sessionHighlights(s).slice(0, 2).join(' · ')}</span>
              {s.records > 0 && ' 🏆'}
            </li>
          ))}
        </ul>
      ) : (
        <>
          <p className="mb-4 text-sm text-text-dim">
            Nada planejado para hoje. Descanse ou escolha uma modalidade.
          </p>
          <div className="flex flex-wrap gap-2">
            {firstStrength && (
              <Button icon={Play} loading={pending} onClick={() => void begin(null, firstStrength.id)}>
                Treino livre
              </Button>
            )}
            <Button variant="ghost" onClick={() => navigate('/academia')}>
              Outras modalidades
            </Button>
          </div>
        </>
      )}
      <ActivityLogModal target={logTarget} onClose={() => setLogTarget(null)} />
    </PolarisCard>
  );
}
