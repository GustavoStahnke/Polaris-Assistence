import { MODALITIES, MODALITY_KIND_LABELS, MODALITY_KINDS, type ModalityKind } from '@polaris/shared';
import { Sparkles } from 'lucide-react';
import { Switch } from '../../components/ui/Input';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { useEnabledModalities, useSaveFitnessSettings } from './api';
import { modalityIcon } from './modality';

const KIND_TRACKS: Record<ModalityKind, string> = {
  forca: 'Fichas, séries, cargas e recordes',
  distancia: 'Distância, tempo, pace e km por semana',
  sessao: 'Duração, rounds, intensidade e notas',
};

/** Escolha das modalidades que aparecem no Treino. */
export function ModalitiesTab() {
  const enabled = useEnabledModalities();
  const save = useSaveFitnessSettings();
  const enabledIds = enabled.map((m) => m.id);

  const toggle = (id: string, on: boolean) =>
    save.mutate({
      // Mantém a ordem do catálogo.
      modalities: MODALITIES.filter((m) => (m.id === id ? on : enabledIds.includes(m.id))).map((m) => m.id),
    });

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-sm text-text-dim">
        Ative as modalidades que você pratica. Elas aparecem em Hoje, nos planos, no histórico e na evolução.
        Desativar só esconde: nada do que já foi registrado é apagado.
      </p>
      {MODALITY_KINDS.map((kind, groupIndex) => (
        <section key={kind}>
          <p className="label-mono mb-3 text-text-dim">
            {MODALITY_KIND_LABELS[kind]} · {KIND_TRACKS[kind]}
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {MODALITIES.filter((m) => m.kind === kind).map((modality, index) => {
              const on = enabledIds.includes(modality.id);
              const lastOne = on && enabledIds.length === 1;
              return (
                <PolarisCard
                  key={modality.id}
                  index={groupIndex * 3 + index}
                  icon={modalityIcon(modality.id)}
                  label={`Modalidade · ${MODALITY_KIND_LABELS[kind]}`}
                  title={modality.name}
                  badge={
                    <Switch
                      checked={on}
                      disabled={lastOne || save.isPending}
                      label={`${on ? 'Desativar' : 'Ativar'} ${modality.name}`}
                      onChange={(checked) => toggle(modality.id, checked)}
                    />
                  }
                  className={on ? undefined : 'opacity-60'}
                >
                  <p className="text-sm text-text-dim">{modality.description}</p>
                  {lastOne && (
                    <p className="mt-2 text-xs text-text-faint">Pelo menos uma modalidade fica ativa.</p>
                  )}
                </PolarisCard>
              );
            })}
          </div>
        </section>
      ))}
      <p className="flex items-center gap-2 text-sm text-text-dim">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden />
        Novas modalidades chegam aos poucos: ciclismo, natação, yoga…
      </p>
    </div>
  );
}
