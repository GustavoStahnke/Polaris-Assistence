import type { Modality, ModalityId } from '@polaris/shared';
import { Layers } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/cn';
import { modalityIcon } from './modality';

export type ModalityFilter = ModalityId | 'todas';

/** Fileira de pílulas para escolher a modalidade (com "Todas", se `withAll`). */
export function ModalityChips<T extends ModalityFilter>({
  modalities,
  value,
  onChange,
  withAll,
  className,
}: {
  modalities: Modality[];
  value: T;
  onChange: (value: T) => void;
  withAll?: boolean;
  className?: string;
}) {
  const options = [
    ...(withAll ? [{ id: 'todas', name: 'Todas', icon: Layers }] : []),
    ...modalities.map((m) => ({ id: m.id, name: m.name, icon: modalityIcon(m.id) })),
  ];
  return (
    <div
      role="group"
      aria-label="Modalidade"
      className={cn('-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1', className)}
    >
      {options.map((option) => (
        <Button
          key={option.id}
          variant="pill"
          icon={option.icon}
          active={value === option.id}
          aria-pressed={value === option.id}
          className="shrink-0"
          onClick={() => onChange(option.id as T)}
        >
          {option.name}
        </Button>
      ))}
    </div>
  );
}
