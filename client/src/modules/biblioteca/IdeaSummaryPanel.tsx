import type { BookIdeaSummary } from '@polaris/shared';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { formatDateTime } from '../../lib/format';

/** "Minhas ideias sobre o livro": resumo das anotações do usuário, gerado pela IA (Etapa 9). */
export function IdeaSummaryPanel({
  summary,
}: {
  bookId: string;
  summary: BookIdeaSummary | null;
  notesCount: number;
}) {
  return (
    <PolarisCard icon={Sparkles} label="Biblioteca · Minhas ideias" title="Minhas ideias sobre o livro">
      {summary ? (
        <>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{summary.content}</p>
          <p className="label-mono mt-2 text-[10px] text-text-dim">
            Atualizado em {formatDateTime(summary.updatedAt)}
          </p>
        </>
      ) : (
        <p className="text-sm text-text-dim">
          Com a IA local conectada, a Polaris resume as <strong className="text-text">suas</strong> ideias a
          partir das suas anotações.{' '}
          <Link to="/integracoes" className="text-primary hover:text-star">
            Conecte a IA em Integrações
          </Link>
          .
        </p>
      )}
    </PolarisCard>
  );
}
