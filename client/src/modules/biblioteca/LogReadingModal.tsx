import { toDateKey, type Book } from '@polaris/shared';
import { BookOpenCheck } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Tabs } from '../../components/ui/Tabs';
import { useLogReading } from './api';

/** "+ páginas": registra a leitura de hoje (ou de outro dia). */
export function LogReadingModal({ book, onClose }: { book: Book | null; onClose: () => void }) {
  return (
    <Modal open={book !== null} onClose={onClose} title={book ? `Registrar leitura · ${book.title}` : ''}>
      {book && <LogReadingForm key={book.id} book={book} onDone={onClose} />}
    </Modal>
  );
}

function LogReadingForm({ book, onDone }: { book: Book; onDone: () => void }) {
  const [mode, setMode] = useState<'paginas' | 'pagina'>('paginas');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(toDateKey());
  const log = useLogReading();
  const quick = [5, 10, 20, 30, 50];

  const submit = async (pages?: number) => {
    const amount = pages ?? Number(value);
    if (!amount) return;
    await log.mutateAsync({
      id: book.id,
      date,
      ...(mode === 'paginas' || pages ? { pagesRead: amount } : { toPage: amount }),
    });
    onDone();
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-text-dim">
        Você está na página <span className="font-mono text-star">{book.currentPage}</span>
        {book.pageCount ? ` de ${book.pageCount}` : ''}.
      </p>
      <div className="flex flex-wrap gap-2">
        {quick.map((n) => (
          <Button key={n} variant="pill" onClick={() => void submit(n)} disabled={log.isPending}>
            +{n}
          </Button>
        ))}
      </div>
      <Tabs
        value={mode}
        onChange={setMode}
        tabs={[
          { id: 'paginas', label: 'Páginas lidas' },
          { id: 'pagina', label: 'Parei na página' },
        ]}
      />
      <div className="grid grid-cols-2 gap-3">
        <Field label={mode === 'paginas' ? 'Quantas páginas' : 'Página atual'}>
          {(id) => (
            <Input
              id={id}
              type="number"
              min={1}
              inputMode="numeric"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          )}
        </Field>
        <Field label="Dia">
          {(id) => <Input id={id} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}
        </Field>
      </div>
      <Button
        variant="primary"
        icon={BookOpenCheck}
        loading={log.isPending}
        disabled={!Number(value)}
        onClick={() => void submit()}
      >
        Registrar
      </Button>
    </div>
  );
}
