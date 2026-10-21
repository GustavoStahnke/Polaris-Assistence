import type { LucideProps } from 'lucide-react';
import { createElement } from 'react';
import { iconByName } from '../../lib/icons';

/** Renderiza um ícone lucide a partir do nome (ex.: "CloudSun"). */
export function DynamicIcon({ name, ...props }: { name: string | null | undefined } & LucideProps) {
  return createElement(iconByName(name), { 'aria-hidden': true, ...props });
}
