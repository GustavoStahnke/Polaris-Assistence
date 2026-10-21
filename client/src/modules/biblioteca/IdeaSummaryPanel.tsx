import type { BookIdeaSummary } from '@polaris/shared';
import { Pencil, RefreshCw, Save, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Input';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { formatDateTime } from '../../lib/format';
import { useAiStatus, useBookSummary } from '../ia/api';
import { integrationsPath } from '../../lib/paths';

/** "Minhas ideias sobre o livro": resumo das anotações do usuário, gerado pela IA e editável. */
export function IdeaSummaryPanel({
  bookId,
  summary,
  notesCount,
}: {
  bookId: string;
  summary: BookIdeaSummary | null;
  notesCount: number;
}) {
  const status = useAiStatus();
  const { generate, save } = useBookSummary(bookId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const available = status.data?.available ?? false;

  return (
    <PolarisCard
      icon={Sparkles}
      label="Biblioteca · Minhas ideias"
      title="Minhas ideias sobre o livro"
      badge={summary?.edited ? <Badge tone="muted">Editado</Badge> : summary ? <Badge>IA</Badge> : undefined}
    >
      {editing ? (
        <div className="space-y-3">
          <Textarea
            rows={8}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            aria-label="Editar resumo"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="primary"
              icon={Save}
              loading={save.isPending}
              onClick={() => save.mutate(draft, { onSuccess: () => setEditing(false) })}
            >
              Salvar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : summary ? (
        <>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{summary.content}</p>
          <p className="label-mono mt-3 text-[10px] text-text-dim">
            Atualizado em {formatDateTime(summary.updatedAt)}
            {summary.model && ` · ${summary.model}`}
          </p>
        </>
      ) : (
        <p className="text-sm text-text-dim">
          A Polaris organiza as <strong className="text-text">suas</strong> ideias a partir das suas anotações
          (não é um resumo do livro).
        </p>
      )}

      {!editing && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {available ? (
            <Button
              size="sm"
              variant={summary ? 'outline' : 'primary'}
              icon={summary ? RefreshCw : Sparkles}
              loading={generate.isPending}
              disabled={notesCount === 0}
              onClick={() => generate.mutate()}
            >
              {summary ? 'Gerar de novo' : 'Gerar resumo das minhas ideias'}
            </Button>
          ) : (
            <Link to={integrationsPath('ollama')} className="label-mono text-primary hover:text-star">
              Conecte a IA em Integrações →
            </Link>
          )}
          {summary && (
            <Button
              size="sm"
              variant="ghost"
              icon={Pencil}
              onClick={() => {
                setDraft(summary.content);
                setEditing(true);
              }}
            >
              Editar
            </Button>
          )}
          {available && notesCount === 0 && (
            <span className="text-xs text-text-dim">Escreva algumas anotações primeiro.</span>
          )}
          {generate.isPending && (
            <span className="text-xs text-text-dim">A IA local pode levar alguns segundos…</span>
          )}
        </div>
      )}
    </PolarisCard>
  );
}
