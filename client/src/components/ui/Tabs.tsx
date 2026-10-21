import { cn } from '../../lib/cn';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
}

/** Abas simples e controladas. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        'flex gap-1 overflow-x-auto rounded-xl border border-border bg-bg-deep/50 p-1',
        className,
      )}
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              'label-mono flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 transition-all',
              active
                ? 'bg-primary/15 text-star shadow-[inset_0_0_0_1px_rgba(56,189,248,0.5)]'
                : 'text-text-dim hover:text-text',
            )}
          >
            {tab.label}
            {tab.count !== undefined && <span className="text-primary">{tab.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
