import { Link } from 'react-router';
import { capitalize, formatLongDate, greeting } from '../../lib/format';
import { useProfile } from '../../lib/hooks/useProfile';
import { WorkoutTodayCard } from '../academia/WorkoutTodayCard';
import { AgendaCard } from '../agenda/AgendaCard';
import { CurrentReadingCard } from '../biblioteca/CurrentReadingCard';
import { RememberCard } from '../biblioteca/RememberCard';
import { WeatherCard } from '../clima/WeatherCard';
import { EmailCard } from '../email/EmailCard';
import { HabitsTodayCard } from '../habitos/HabitsTodayCard';
import { NewsCard } from '../noticias/NewsCard';
import { TasksTodayCard } from '../tarefas/TasksTodayCard';
import { AlertsStrip } from './AlertsStrip';
import { NucleusPanel } from './NucleusPanel';

export function PainelPage() {
  const now = new Date();
  const { displayName, data: profile } = useProfile();
  return (
    <div>
      <div className="mb-5">
        <p className="label-mono text-primary">Painel · Briefing do dia</p>
        <h1 className="mt-1 text-2xl font-semibold md:text-3xl">
          {greeting(now)}
          {displayName ? `, ${displayName}` : ''}!
        </h1>
        <p className="text-sm text-text-dim">
          {capitalize(formatLongDate(now))}
          {profile && !displayName && (
            <>
              {' · '}
              <Link to="/configuracoes" className="text-primary hover:text-star">
                Diga à Polaris como te chamar
              </Link>
            </>
          )}
        </p>
      </div>

      <AlertsStrip />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <NucleusPanel summary="Seu briefing do dia aparece aqui." />
        </div>
        <WeatherCard index={0} className="lg:col-start-1 lg:row-start-1" />
        <AgendaCard index={1} className="lg:col-start-3 lg:row-start-1" />
        <EmailCard index={2} className="lg:col-start-1 lg:row-start-2" />
        <NewsCard index={3} className="lg:col-start-3 lg:row-start-2" />
        <CurrentReadingCard index={4} />
        <WorkoutTodayCard index={5} />
        <HabitsTodayCard index={6} />
        <TasksTodayCard index={7} />
        <RememberCard index={8} />
      </div>
    </div>
  );
}
