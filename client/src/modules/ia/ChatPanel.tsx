import type { AiMessage } from '@polaris/shared';
import { Bot, MessageSquarePlus, Send, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { StarIcon } from '../../components/core/Logo';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Textarea } from '../../components/ui/Input';
import { cn } from '../../lib/cn';
import { formatRelative, formatTime } from '../../lib/format';
import { useAiStatus, useConversation, useConversations, useDeleteConversation, useSendMessage } from './api';

const SUGGESTIONS = [
  'Como está meu dia?',
  'O que tenho de mais urgente?',
  'Como vai minha leitura?',
  'Me dê uma dica para hoje',
];

/** Canal Polaris: conversa por texto com a IA, com o histórico salvo. */
export function ChatPanel({ compact }: { compact?: boolean }) {
  const status = useAiStatus();
  const conversations = useConversations();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const conversation = useConversation(conversationId);
  const send = useSendMessage();
  const remove = useDeleteConversation();
  const [text, setText] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const messages: AiMessage[] = conversation.data?.messages ?? [];

  // Rola só a lista de mensagens (e não a página inteira) quando chega mensagem nova.
  useEffect(() => {
    const list = listRef.current;
    if (list && (messages.length > 0 || pending))
      list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
  }, [messages.length, pending]);

  const submit = async (message: string) => {
    const content = message.trim();
    if (!content || send.isPending) return;
    setText('');
    setPending(content);
    try {
      const result = await send.mutateAsync({ conversationId, message: content });
      setConversationId(result.conversationId);
    } finally {
      setPending(null);
    }
  };

  if (status.data && !status.data.available) {
    return (
      <EmptyState
        icon={Bot}
        title="O Canal Polaris precisa da IA local"
        message={
          <>
            Instale o Ollama (gratuito) e conecte em Integrações. Depois é só conversar: a Polaris conhece sua
            agenda, clima, e-mails, leitura e treino do dia.
          </>
        }
        action={
          <Link to="/integracoes?config=ollama" className="label-mono text-primary hover:text-star">
            Conecte a IA em Integrações →
          </Link>
        }
      />
    );
  }

  return (
    <div className={cn('grid gap-4', !compact && 'md:grid-cols-[220px_1fr]')}>
      {!compact && (
        <aside className="space-y-2">
          <Button
            size="sm"
            variant="primary"
            icon={MessageSquarePlus}
            className="w-full justify-center"
            onClick={() => setConversationId(null)}
          >
            Nova conversa
          </Button>
          <ul className="max-h-80 space-y-1 overflow-y-auto">
            {conversations.data?.map((c) => (
              <li key={c.id} className="group flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setConversationId(c.id)}
                  className={cn(
                    'min-w-0 flex-1 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                    c.id === conversationId
                      ? 'bg-primary/15 text-star'
                      : 'text-text-dim hover:bg-primary/5 hover:text-text',
                  )}
                >
                  <span className="block truncate">{c.title}</span>
                  <span className="label-mono text-[9px] text-text-dim">{formatRelative(c.updatedAt)}</span>
                </button>
                <button
                  type="button"
                  aria-label="Apagar conversa"
                  onClick={() => {
                    remove.mutate(c.id);
                    if (c.id === conversationId) setConversationId(null);
                  }}
                  className="p-1 text-text-faint opacity-0 group-hover:opacity-100 hover:text-danger focus-visible:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </aside>
      )}

      <div className="flex min-h-[320px] flex-col">
        <div
          ref={listRef}
          className={cn('flex-1 space-y-3 overflow-y-auto pr-1', compact ? 'max-h-[55vh]' : 'max-h-[420px]')}
          aria-live="polite"
        >
          {messages.length === 0 && !pending && (
            <div className="py-6 text-center">
              <StarIcon className="mx-auto h-10 w-10" />
              <p className="mt-3 text-sm text-text-dim">
                Pergunte qualquer coisa sobre o seu dia. A Polaris responde usando o seu briefing.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <Button key={s} variant="pill" onClick={() => void submit(s)}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <Bubble key={m.id} role={m.role} content={m.content} time={m.createdAt} />
          ))}
          <AnimatePresence>
            {pending && (
              <>
                <Bubble role="user" content={pending} />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-sm text-text-dim"
                >
                  <StarIcon className="h-5 w-5 animate-pulse" /> A Polaris está pensando…
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-3 flex items-end gap-2 border-t border-border/50 pt-3">
          <Textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void submit(text);
              }
            }}
            placeholder="Fale com a Polaris… (Enter envia, Shift+Enter quebra a linha)"
            aria-label="Mensagem para a Polaris"
            className="resize-none"
          />
          <Button
            variant="primary"
            size="icon"
            icon={Send}
            aria-label="Enviar"
            loading={send.isPending}
            disabled={!text.trim()}
            onClick={() => void submit(text)}
          />
        </div>
      </div>
    </div>
  );
}

function Bubble({ role, content, time }: { role: AiMessage['role']; content: string; time?: string }) {
  const mine = role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-2', mine && 'justify-end')}
    >
      {!mine && <StarIcon className="mt-1 h-5 w-5 shrink-0" />}
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
          mine ? 'rounded-br-md bg-primary/20 text-text' : 'glass rounded-bl-md bg-bg-base/80',
        )}
      >
        {content}
        {time && (
          <span className="label-mono mt-1 block text-right text-[9px] text-text-dim">
            {formatTime(time)}
          </span>
        )}
      </div>
    </motion.div>
  );
}
