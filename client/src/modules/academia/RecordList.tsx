import type { PersonalRecord } from '@polaris/shared';
import { Trophy } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { formatNumber, formatShortDate } from '../../lib/format';
import { prLabel } from './modality';

/** Uma linha de recorde, com brilho dourado-estelar. Com `to`, vira link para o treino. */
export function RecordRow({
  title,
  subtitle,
  value,
  to,
}: {
  title: string;
  subtitle: string;
  value: ReactNode;
  to?: string;
}) {
  const content = (
    <>
      <Trophy
        className="h-4 w-4 shrink-0 text-star drop-shadow-[0_0_6px_rgba(165,243,252,0.9)]"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="text-xs text-text-dim">{subtitle}</p>
      </div>
      <span className="text-right font-mono text-sm text-star">{value}</span>
    </>
  );
  const className =
    'flex items-center gap-3 rounded-xl border border-star/40 bg-star/5 p-3 shadow-[0_0_calc(18px*var(--glow-strength))_rgba(165,243,252,calc(0.18*var(--glow-strength)))]';
  return (
    <li>
      {to ? (
        <Link to={to} className={`${className} transition-colors hover:border-star/70`}>
          {content}
        </Link>
      ) : (
        <div className={className}>{content}</div>
      )}
    </li>
  );
}

/** Recordes pessoais de força (carga, 1RM, volume e repetições). */
export function RecordList({ records }: { records: PersonalRecord[] }) {
  if (records.length === 0) return <p className="text-sm text-text-dim">Nenhum recorde ainda.</p>;
  return (
    <ul className="space-y-2">
      {records.map((r) => (
        <RecordRow
          key={r.id}
          title={r.exerciseName}
          subtitle={`${prLabel(r.type, r.measure)} · ${formatShortDate(r.achievedAt)}`}
          value={
            r.type === 'max_reps' ? (
              `${formatNumber(r.value)} ${r.measure === 'tempo' ? 's' : 'reps'}`
            ) : (
              <>
                {formatNumber(r.value, 1)} kg
                {r.type !== 'max_1rm' && (
                  <span className="text-text-dim">
                    {' '}
                    ({r.weight}×{r.reps})
                  </span>
                )}
              </>
            )
          }
        />
      ))}
    </ul>
  );
}
