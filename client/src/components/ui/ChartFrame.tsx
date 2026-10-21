import type { ReactElement } from 'react';
import { ResponsiveContainer } from 'recharts';

/** Área do gráfico com altura fixa e largura responsiva. */
export function ChartFrame({ height = 240, children }: { height?: number; children: ReactElement }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
