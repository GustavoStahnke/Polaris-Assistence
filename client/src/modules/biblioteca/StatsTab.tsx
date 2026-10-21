import { BarChart3, BookOpen, Flame, PenTool, Users } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartFrame } from '../../components/ui/ChartFrame';
import { CountUp } from '../../components/ui/CountUp';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { axisProps, CHART_COLORS, gridProps, tooltipProps } from '../../lib/chartTheme';
import { formatNumber } from '../../lib/format';
import { useStats } from './api';

const monthLabel = (month: string) =>
  new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    .format(new Date(`${month}-15T12:00:00`))
    .replace('.', '');

export function StatsTab() {
  const year = new Date().getFullYear();
  const stats = useStats(year);
  const data = stats.data;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={BookOpen} label={`Livros lidos em ${year}`} value={data?.booksFinished ?? 0} />
        <StatTile icon={PenTool} label={`Páginas em ${year}`} value={data?.pagesRead ?? 0} />
        <StatTile
          icon={BarChart3}
          label="Páginas por dia (30 dias)"
          value={data?.pagesPerDay ?? 0}
          decimals={1}
        />
        <StatTile
          icon={Flame}
          label={data?.readingToday ? 'Dias seguidos (hoje ✓)' : 'Dias seguidos lendo'}
          value={data?.streak ?? 0}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <PolarisCard
          icon={BarChart3}
          label={`Leitura · ${year}`}
          title="Páginas por mês"
          state={stats.isPending ? 'loading' : 'ready'}
        >
          <ChartFrame height={240}>
            <BarChart data={data?.pagesByMonth ?? []} margin={{ top: 10, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="month" {...axisProps} tickFormatter={monthLabel} />
              <YAxis {...axisProps} width={44} allowDecimals={false} />
              <Tooltip
                {...tooltipProps}
                cursor={{ fill: 'rgba(56,189,248,0.08)' }}
                labelFormatter={(m) => monthLabel(String(m))}
                formatter={(v) => [`${formatNumber(Number(v))} páginas`, 'Lidas']}
              />
              <Bar dataKey="pages" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ChartFrame>
        </PolarisCard>

        <PolarisCard
          icon={BookOpen}
          label="Leitura · Histórico"
          title="Livros por ano"
          state={stats.isPending ? 'loading' : 'ready'}
        >
          {data?.booksByYear.length ? (
            <ChartFrame height={240}>
              <BarChart data={data.booksByYear} margin={{ top: 10, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="year" {...axisProps} />
                <YAxis {...axisProps} width={44} allowDecimals={false} />
                <Tooltip
                  {...tooltipProps}
                  cursor={{ fill: 'rgba(56,189,248,0.08)' }}
                  formatter={(v) => [`${v} livro(s)`, 'Lidos']}
                />
                <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ChartFrame>
          ) : (
            <p className="text-sm text-text-dim">Marque livros como lidos para ver o histórico por ano.</p>
          )}
        </PolarisCard>

        <PolarisCard icon={BarChart3} label="Leitura · Gêneros" title="Assuntos mais lidos">
          <RankList
            items={data?.topSubjects ?? []}
            empty="Os assuntos aparecem conforme você lê livros da Open Library."
          />
        </PolarisCard>
        <PolarisCard icon={Users} label="Leitura · Autores" title="Autores mais lidos">
          <RankList
            items={data?.topAuthors ?? []}
            empty="Termine alguns livros para ver seus autores favoritos."
          />
        </PolarisCard>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  decimals = 0,
}: {
  icon: typeof BookOpen;
  label: string;
  value: number;
  decimals?: number;
}) {
  return (
    <div className="glass p-4">
      <Icon className="h-4 w-4 text-primary" aria-hidden />
      <p className="mt-2 font-display text-3xl font-bold text-star glow-text">
        <CountUp value={value} decimals={decimals} />
      </p>
      <p className="label-mono mt-1 text-[10px] text-text-dim">{label}</p>
    </div>
  );
}

/** Lista com barras horizontais (melhor que pizza para comparar quantidades). */
function RankList({ items, empty }: { items: Array<{ name: string; count: number }>; empty: string }) {
  if (items.length === 0) return <p className="text-sm text-text-dim">{empty}</p>;
  const max = Math.max(...items.map((i) => i.count));
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item.name}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="truncate capitalize">{item.name}</span>
            <span className="font-mono text-text-dim">{item.count}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-primary/10">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
