import { Newspaper } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../lib/cn';

/** Imagem da notícia com um fundo de reserva quando não carrega (ou sem internet). */
export function NewsImage({ src, className }: { src: string | null; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-primary-2/25 to-bg-base',
          className,
        )}
        aria-hidden
      >
        <Newspaper className="h-6 w-6 text-primary/60" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  );
}
