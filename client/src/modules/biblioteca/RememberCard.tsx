import { BOOK_NOTE_TYPE_LABELS } from '@polaris/shared';
import { Lightbulb } from 'lucide-react';
import { Link } from 'react-router';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { useRemember } from './api';

/** Card "Relembrar": duas anotações antigas por dia (revisão espaçada simples). */
export function RememberCard({ index, className }: { index?: number; className?: string }) {
  const remember = useRemember();
  const items = remember.data ?? [];
  return (
    <PolarisCard
      index={index}
      className={className}
      icon={Lightbulb}
      label="Biblioteca · Relembrar"
      title="Anotações para revisitar"
      state={remember.isPending ? 'loading' : remember.isError ? 'error' : items.length ? 'ready' : 'empty'}
      emptyTitle="Nada para relembrar ainda"
      emptyMessage="Suas anotações de livros voltam aqui de vez em quando, para fixar o que importa."
      errorMessage="Não foi possível carregar as anotações."
      to="/biblioteca"
    >
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.note.id}>
            <Link to={`/biblioteca/livro/${item.bookId}`} className="group block">
              <blockquote className="border-l-2 border-primary/60 pl-3 text-sm leading-relaxed transition-colors group-hover:border-star">
                <span className="line-clamp-3">{item.note.content}</span>
              </blockquote>
              <p className="label-mono mt-1 pl-3 text-[10px] text-text-dim">
                {BOOK_NOTE_TYPE_LABELS[item.note.type]} · {item.bookTitle}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </PolarisCard>
  );
}
