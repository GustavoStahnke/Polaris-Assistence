import { useNavigate } from 'react-router';
import { NucleoPolaris } from '../../components/core/NucleoPolaris';
import { Button } from '../../components/ui/Button';
import { useUiStore } from '../../stores/uiStore';
import { Badge } from '../../components/ui/Badge';
import { useAiBriefing, useAiStatus, useBriefing } from '../ia/api';

const SHORTCUTS = [
  { label: 'Agenda', to: '/agenda' },
  { label: 'E-mails', to: '/email' },
  { label: 'Notícias', to: '/noticias' },
  { label: 'Clima', to: '/clima' },
  { label: 'Leitura', to: '/biblioteca' },
];

/** Núcleo Polaris no centro do Painel, com o painel de status "Briefing do dia". */
export function NucleusPanel() {
  const navigate = useNavigate();
  const nucleusState = useUiStore((s) => s.nucleusState);
  const briefing = useBriefing();
  const status = useAiStatus();
  const aiBriefing = useAiBriefing(Boolean(status.data?.available));
  const aiSentence = aiBriefing.data?.sentence;
  const summary = aiSentence ?? briefing.data?.sentence ?? 'Montando seu briefing…';
  const loading = aiBriefing.isFetching;

  return (
    <div className="relative flex h-full min-h-[340px] flex-col items-center justify-center md:min-h-[460px]">
      <NucleoPolaris
        state={loading ? 'processando' : nucleusState}
        className="w-[min(78vw,300px)] md:w-[min(100%,420px)]"
      />
      <div className="glass relative -mt-10 w-full max-w-md bg-bg-base/70 px-5 py-4 text-center md:-mt-16">
        <p className="label-mono flex items-center justify-center gap-2 text-primary">
          Briefing do dia
          {aiSentence && <Badge tone="star">IA</Badge>}
        </p>
        <p className="mt-1.5 text-[15px] leading-snug font-medium text-text">{summary}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {SHORTCUTS.map((s) => (
            <Button key={s.to} variant="pill" onClick={() => navigate(s.to)}>
              {s.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
