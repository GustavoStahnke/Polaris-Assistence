import { StarIcon } from '../components/core/Logo';

/** Tela rápida exibida enquanto a primeira página carrega. */
export function BootScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg-deep">
      <StarIcon className="h-12 w-12 animate-pulse" />
    </div>
  );
}
