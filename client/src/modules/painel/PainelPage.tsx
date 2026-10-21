import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckSquare,
  CloudSun,
  Lightbulb,
  Mail,
  Newspaper,
  Target,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { CountUp } from '../../components/ui/CountUp';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { Link } from 'react-router';
import { capitalize, formatLongDate, greeting } from '../../lib/format';
import { useProfile } from '../../lib/hooks/useProfile';
import { WorkoutTodayCard } from '../academia/WorkoutTodayCard';
import { NucleusPanel } from './NucleusPanel';

// Dados fictícios só para mostrar o visual (os dados reais chegam nas próximas etapas).
const demo = {
  alerts: ['Vai chover às 16h.', 'Reunião em 20 minutos.'],
  weather: { temp: 26, condition: 'Ensolarado', min: 18, max: 29, feels: 27 },
  events: [
    { time: '10:30', title: 'Reunião de planejamento' },
    { time: '14:00', title: 'Dentista' },
    { time: '19:00', title: 'Jantar com a família' },
  ],
  emails: [
    { from: 'Banco', subject: 'Fatura disponível' },
    { from: 'Ana Souza', subject: 'Revisão do projeto' },
    { from: 'Equipe', subject: 'Reunião remarcada' },
  ],
  news: ['Nova missão espacial é anunciada', 'Mercado fecha em alta', 'IA ajuda a prever chuvas'],
};

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

      <div className="mb-5 flex flex-wrap gap-2">
        {demo.alerts.map((alert) => (
          <div
            key={alert}
            className="flex items-center gap-2 rounded-full border border-warning/40 bg-warning/10 px-3.5 py-1.5 text-sm text-warning"
          >
            <AlertTriangle className="h-4 w-4" aria-hidden /> {alert}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <NucleusPanel summary="3 compromissos · 5 e-mails importantes · 26° ensolarado" />
        </div>

        <PolarisCard
          index={0}
          icon={CloudSun}
          label="Panorama · Clima"
          title="São Paulo"
          badge={<Badge>Agora</Badge>}
          footer="Open-Meteo · demo"
          to="/clima"
          className="lg:col-start-1 lg:row-start-1"
        >
          <div className="flex items-end gap-4">
            <span className="glow-text font-display text-5xl font-bold text-star">
              <CountUp value={demo.weather.temp} />°
            </span>
            <div className="pb-1 text-sm text-text-dim">
              <p className="text-text">{demo.weather.condition}</p>
              <p>
                Mín {demo.weather.min}° · Máx {demo.weather.max}° · Sensação {demo.weather.feels}°
              </p>
            </div>
          </div>
        </PolarisCard>

        <PolarisCard
          index={1}
          icon={CalendarDays}
          label="Agenda · Hoje"
          title="Reunião de planejamento"
          badge={<Badge tone="warning">em 20 min</Badge>}
          footer="Google Agenda · demo"
          to="/agenda"
          className="lg:col-start-3 lg:row-start-1"
        >
          <ul className="space-y-2">
            {demo.events.map((e) => (
              <li key={e.title} className="flex gap-3 text-sm">
                <span className="font-mono text-primary">{e.time}</span>
                <span>{e.title}</span>
              </li>
            ))}
          </ul>
        </PolarisCard>

        <PolarisCard
          index={2}
          icon={Mail}
          label="Comunicações · E-mail"
          title="5 importantes"
          footer="Gmail · demo"
          to="/email"
          className="lg:col-start-1 lg:row-start-2"
        >
          <ul className="space-y-2">
            {demo.emails.map((e) => (
              <li key={e.subject} className="text-sm">
                <span className="font-semibold">{e.from}</span>
                <span className="text-text-dim"> · {e.subject}</span>
              </li>
            ))}
          </ul>
        </PolarisCard>

        <PolarisCard
          index={3}
          icon={Newspaper}
          label="Radar · Notícias"
          title="Destaques"
          badge={<Badge>Agora</Badge>}
          footer="RSS · demo"
          to="/noticias"
          className="lg:col-start-3 lg:row-start-2"
        >
          <ul className="space-y-2 text-sm">
            {demo.news.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </PolarisCard>

        <PolarisCard
          index={4}
          icon={BookOpen}
          label="Biblioteca · Leitura"
          title="O Hobbit"
          to="/biblioteca"
          footer="Página 120 de 310"
        >
          <div className="h-2 overflow-hidden rounded-full bg-primary/10">
            <div className="h-full w-[39%] rounded-full bg-gradient-to-r from-primary-2 to-primary shadow-[0_0_10px_rgba(56,189,248,0.7)]" />
          </div>
          <p className="mt-2 text-sm text-text-dim">39% lido</p>
        </PolarisCard>

        <WorkoutTodayCard index={5} />

        <PolarisCard
          index={6}
          icon={Target}
          label="Rotina · Hábitos"
          title="Hábitos de hoje"
          to="/habitos"
          state="empty"
          emptyTitle="Nenhum hábito ainda"
          emptyMessage="Crie seu primeiro hábito e a Polaris acompanha a sequência."
        />

        <PolarisCard
          index={7}
          icon={CheckSquare}
          label="Foco · Tarefas"
          title="Tarefas do dia"
          to="/tarefas"
          state="error"
          errorMessage="Exemplo do estado de erro."
        />

        <PolarisCard
          index={8}
          icon={Lightbulb}
          label="Biblioteca · Relembrar"
          title="Anotações antigas"
          to="/biblioteca"
        >
          <blockquote className="border-l-2 border-primary/60 pl-3 text-sm text-text-dim italic">
            “Não é o que temos, mas o que fazemos com o que temos.”
          </blockquote>
        </PolarisCard>
      </div>
    </div>
  );
}
