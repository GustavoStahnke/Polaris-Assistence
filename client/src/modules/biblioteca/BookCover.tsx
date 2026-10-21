import { BookOpen } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/cn';

/** Capa do livro. Sem imagem (ou offline), mostra uma capa gerada com o título. */
export function BookCover({
  url,
  title,
  className,
}: {
  url: string | null;
  title: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  // Largura padrão só quando quem usa não definiu outra (evita conflito entre w-full e w-20).
  const width = /(^|\s)w-/.test(className ?? '') ? undefined : 'w-full';

  if (url && !failed) {
    return (
      <img
        src={url}
        alt={`Capa de ${title}`}
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn(
          'aspect-[2/3] rounded-lg border border-border/60 object-cover shadow-lg',
          width,
          className,
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        'flex aspect-[2/3] flex-col items-center justify-center gap-2 rounded-lg border border-primary/40 bg-gradient-to-br from-primary-2/30 via-bg-base to-primary/20 p-3 text-center',
        width,
        className,
      )}
      role="img"
      aria-label={`Capa de ${title}`}
    >
      <BookOpen className="h-6 w-6 text-primary" aria-hidden />
      <span className="line-clamp-4 text-xs font-semibold text-text">{title}</span>
    </div>
  );
}
