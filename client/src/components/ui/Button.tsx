import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger' | 'pill';
type Size = 'sm' | 'md' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  loading?: boolean;
  active?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-primary/15 text-star border border-primary/60 hover:bg-primary/25 hover:border-primary shadow-[0_0_calc(16px*var(--glow-strength))_rgba(56,189,248,calc(0.25*var(--glow-strength)))]',
  outline: 'bg-transparent text-text border border-border hover:border-primary/70 hover:text-star',
  ghost: 'bg-transparent text-text-dim border border-transparent hover:text-star hover:bg-primary/10',
  danger: 'bg-danger/10 text-danger border border-danger/50 hover:bg-danger/20',
  pill: 'rounded-full bg-bg-base/60 text-text-dim border border-border hover:text-star hover:border-primary/70 font-mono text-[11px] tracking-[0.18em] uppercase',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  icon: 'h-9 w-9 justify-center',
};

/** Botão padrão do Polaris. Botões só com ícone precisam de aria-label. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'outline', size = 'md', icon: Icon, loading, active, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center rounded-xl font-medium transition-all duration-200 select-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        variant === 'pill' && size !== 'icon' && 'h-8 px-3.5',
        active && 'border-primary text-star bg-primary/15',
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden />
      )}
      {children}
    </button>
  );
});
