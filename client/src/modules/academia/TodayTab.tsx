import {
  getModality,
  WEEKDAY_LABELS,
  type Modality,
  type Routine,
  type WorkoutSessionSummary,
} from '@polaris/shared';
import { CheckCircle2, ClipboardPen, Moon, Play, Timer, Zap } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { formatDuration, formatRelative, plural } from '../../lib/format';
import { ActivityLogModal, type ActivityTarget } from './ActivityLogModal';
import { useEnabledModalities, useRoutines, useTodayWorkout } from './api';
import { formatKm, modalityIcon, planTargets, sessionHighlights } from './modality';
import { useBeginWorkout } from './useBeginWorkout';

export function TodayTab() {
  const today = useTodayWorkout();
  const routines = useRoutines();
  const modalities = useEnabledModalities();
  const { begin, pending } = useBeginWorkout();
  const navigate = useNavigate();
  const [logTarget, setLogTarget] = useState<ActivityTarget | null>(null);
  const data = today.data;
  const enabledIds = new Set<string>(modalities.map((m) => m.id));
  // Outras fichas de força (as de hoje já aparecem em destaque).
  const others = (routines.data ?? []).filter(
    (r) =>
      getModality(r.modality).kind === 'forca' &&
      enabledIds.has(r.modality) &&
      !data?.planned.some((p) => p.id === r.id),
  );

  if (today.isPending) return <PolarisCard label="Treino · Hoje" state="loading" />;

  const startModality = (modality: Modality) =>
    modality.kind === 'forca' ? void begin(null, modality.id) : setLogTarget({ modality: modality.id });

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        {data?.activeSession && (
          <PolarisCard
            icon={Timer}
            label={`${getModality(data.activeSession.modality).name} · Em andamento`}
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

        {data?.planned.map((routine, index) =>
          getModality(routine.modality).kind === 'forca' ? (
            !data.activeSession && (
              <RoutineStartCard
                key={routine.id}
                index={index}
                routine={routine}
                planned
                onStart={() => void begin(routine.id)}
                pending={pending}
              />
            )
          ) : (
            <PlanCard
              key={routine.id}
              index={index}
              routine={routine}
              onLog={() => setLogTarget({ modality: routine.modality, plan: routine })}
            />
          ),
        )}

        {data?.doneToday.map((session, index) => (
          <DoneCard key={session.id} session={session} index={index} />
        ))}

        {data && !data.activeSession && data.planned.length === 0 && data.doneToday.length === 0 && (
          <PolarisCard icon={Moon} label="Treino · Hoje" title="Dia de descanso">
            <EmptyState
              compact
              title="Nada planejado para hoje"
              message="Descansar também faz parte do treino. Se quiser se mexer mesmo assim, escolha uma modalidade abaixo."
            />
          </PolarisCard>
        )}

        <div>
          <p className="label-mono mb-3 text-text-dim">
            {data?.doneToday.length || data?.planned.length ? 'Outro treino' : 'Começar um treino'}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {modalities.map((modality) => {
              const Icon = modalityIcon(modality.id);
              return (
                <button
                  key={modality.id}
                  type="button"
                  disabled={pending}
                  onClick={() => startModality(modality)}
                  className="glass group flex items-center gap-3 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary/60 disabled:opacity-60"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary glow-box">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium group-hover:text-star">{modality.name}</span>
                    <span className="label-mono block truncate text-[10px] text-text-dim">
                      {modality.kind === 'forca' ? 'Treino livre' : 'Registrar'}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {!data?.activeSession && others.length > 0 && (
          <div>
            <p className="label-mono mb-3 text-text-dim">Outras fichas</p>
            <div className="grid gap-4 md:grid-cols-2">
              {others.map((routine, index) => (
                <RoutineStartCard
                  key={routine.id}
                  index={index}
                  routine={routine}
                  onStart={() => void begin(routine.id)}
                  pending={pending}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <PolarisCard icon={Zap} label="Treino · Semana" title="Seu ritmo" className="lg:self-start">
        <p className="font-display text-4xl font-bold text-star glow-text">{data?.weekCount ?? 0}</p>
        <p className="text-sm text-text-dim">treinos nesta semana</p>
        {data && data.week.length > 0 && (
          <ul className="mt-4 space-y-2">
            {data.week.map((item) => {
              const Icon = modalityIcon(item.modality);
              const kind = getModality(item.modality).kind;
              return (
                <li key={item.modality} className="flex items-center gap-2 text-sm">
                  <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span className="flex-1">{getModality(item.modality).name}</span>
                  <span className="font-mono text-text-dim">
                    {plural(item.sessions, 'treino')}
                    {kind === 'distancia' && item.distanceKm > 0 && ` · ${formatKm(item.distanceKm)}`}
                    {kind === 'sessao' && ` · ${formatDuration(item.durationSeconds)}`}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {data?.lastSession && (
          <p className="mt-4 text-sm text-text-dim">
            Último: <span className="text-text">{data.lastSession.routineName}</span>{' '}
            {formatRelative(data.lastSession.startedAt)}
          </p>
        )}
      </PolarisCard>

      <ActivityLogModal target={logTarget} onClose={() => setLogTarget(null)} />
    </div>
  );
}

/** Dias da semana da ficha ou do plano, em pílulas. */
function WeekdayBadges({ routine, highlight }: { routine: Routine; highlight?: boolean }) {
  return (
    <span className="flex gap-1">
      {routine.weekdays.map((d) => (
        <Badge key={d} tone={highlight ? 'primary' : 'muted'}>
          {WEEKDAY_LABELS[d]}
        </Badge>
      ))}
    </span>
  );
}

function PlanCard({ routine, index, onLog }: { routine: Routine; index: number; onLog: () => void }) {
  const modality = getModality(routine.modality);
  return (
    <PolarisCard
      index={index}
      icon={modalityIcon(routine.modality)}
      label={`${modality.name} · Planejado para hoje`}
      title={routine.name}
      badge={<WeekdayBadges routine={routine} highlight />}
    >
      {planTargets(routine) && <p className="font-mono text-sm text-text-dim">{planTargets(routine)}</p>}
      {routine.description && <p className="mt-2 text-sm text-text-dim">{routine.description}</p>}
      <Button className="mt-4" variant="primary" icon={ClipboardPen} onClick={onLog}>
        Registrar treino
      </Button>
    </PolarisCard>
  );
}

function DoneCard({ session, index }: { session: WorkoutSessionSummary; index: number }) {
  const modality = getModality(session.modality);
  return (
    <PolarisCard
      index={index}
      icon={CheckCircle2}
      label={`${modality.name} · Concluído hoje`}
      title={session.routineName ?? modality.name}
      badge={<Badge tone="success">Feito</Badge>}
    >
      <p className="font-mono text-sm text-text-dim">
        {sessionHighlights(session).join(' · ')}
        {session.records > 0 && ` · ${plural(session.records, 'recorde')}`}
      </p>
      <Link
        to={`/academia/treino/${session.id}`}
        className="label-mono mt-3 inline-block text-primary hover:text-star"
      >
        Ver detalhes
      </Link>
    </PolarisCard>
  );
}

function RoutineStartCard({
  routine,
  planned,
  onStart,
  pending,
  index,
}: {
  routine: Routine;
  planned?: boolean;
  onStart: () => void;
  pending: boolean;
  index: number;
}) {
  const modality = getModality(routine.modality);
  return (
    <PolarisCard
      index={index}
      icon={modalityIcon(routine.modality)}
      label={`${modality.name} · ${planned ? 'Planejado para hoje' : 'Ficha'}`}
      title={routine.name}
      badge={<WeekdayBadges routine={routine} highlight={planned} />}
    >
      <ul className="space-y-1.5 text-sm">
        {routine.exercises.map((e) => (
          <li key={e.id} className="flex justify-between gap-3">
            <span>{e.exerciseName}</span>
            <span className="font-mono text-text-dim">
              {e.targetSets}×{e.targetReps}
              {e.measure === 'tempo' ? 's' : ''}
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
