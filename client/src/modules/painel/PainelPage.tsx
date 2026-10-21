import type { LucideIcon } from 'lucide-react';
import { CalendarDays, CheckSquare, CloudSun, Mail, Newspaper, Target } from 'lucide-react';
import { Link } from 'react-router';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { capitalize, formatLongDate, greeting } from '../../lib/format';
import { useProfile } from '../../lib/hooks/useProfile';
import { WorkoutTodayCard } from '../academia/WorkoutTodayCard';
import { CurrentReadingCard } from '../biblioteca/CurrentReadingCard';
import { RememberCard } from '../biblioteca/RememberCard';
import { NucleusPanel } from './NucleusPanel';

/** Card provisório de um módulo que ainda vai ganhar dados reais no Painel. */
function UpcomingCard({
  icon,
  label,
  title,
  to,
  stage,
  index,
  className,
}: {
  icon: LucideIcon;
  label: string;
  title: string;
  to: string;
  stage: number;
  index: number;
  className?: string;
}) {
  return (
    <PolarisCard
      index={index}
      icon={icon}
      label={label}
      title={title}
      to={to}
      state="empty"
      emptyTitle="Chegando em breve"
      emptyMessage={`Este card ganha dados reais na Etapa ${stage}.`}
      className={className}
    />
  );
}

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

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <NucleusPanel summary="Seu briefing do dia aparece aqui." />
        </div>
        <UpcomingCard
          index={0}
          icon={CloudSun}
          label="Panorama · Clima"
          title="Clima"
          to="/clima"
          stage={6}
          className="lg:col-start-1 lg:row-start-1"
        />
        <UpcomingCard
          index={1}
          icon={CalendarDays}
          label="Agenda · Hoje"
          title="Compromissos"
          to="/agenda"
          stage={8}
          className="lg:col-start-3 lg:row-start-1"
        />
        <UpcomingCard
          index={2}
          icon={Mail}
          label="Comunicações · E-mail"
          title="E-mails importantes"
          to="/email"
          stage={8}
          className="lg:col-start-1 lg:row-start-2"
        />
        <UpcomingCard
          index={3}
          icon={Newspaper}
          label="Radar · Notícias"
          title="Destaques"
          to="/noticias"
          stage={6}
          className="lg:col-start-3 lg:row-start-2"
        />
        <CurrentReadingCard index={4} />
        <WorkoutTodayCard index={5} />
        <UpcomingCard
          index={6}
          icon={Target}
          label="Rotina · Hábitos"
          title="Hábitos de hoje"
          to="/habitos"
          stage={7}
        />
        <UpcomingCard
          index={7}
          icon={CheckSquare}
          label="Foco · Tarefas"
          title="Tarefas do dia"
          to="/tarefas"
          stage={7}
        />
        <RememberCard index={8} />
      </div>
    </div>
  );
}
