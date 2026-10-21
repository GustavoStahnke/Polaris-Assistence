import { Star } from 'lucide-react';
import { cn } from '../../lib/cn';

/** Avaliação de 1 a 5 estrelas. Clicar na estrela atual remove a nota. */
export function StarRating({
  value,
  onChange,
  size = 'md',
}: {
  value: number | null;
  onChange?: (value: number | null) => void;
  size?: 'sm' | 'md';
}) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  return (
    <div
      className="flex gap-0.5"
      role={onChange ? 'radiogroup' : 'img'}
      aria-label={`Avaliação: ${value ?? 0} de 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (value ?? 0) >= n;
        const icon = (
          <Star
            className={cn(
              iconSize,
              filled
                ? 'fill-warning text-warning drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                : 'text-text-faint',
            )}
            aria-hidden
          />
        );
        return onChange ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
            onClick={() => onChange(value === n ? null : n)}
            className="rounded p-0.5 hover:scale-110"
          >
            {icon}
          </button>
        ) : (
          <span key={n}>{icon}</span>
        );
      })}
    </div>
  );
}
