// Estilo comum dos gráficos (Recharts) no visual do Polaris:
// grade discreta, eixos em fonte mono, linhas finas e tooltip de vidro.

export const CHART_COLORS = {
  primary: '#38BDF8',
  secondary: '#3B82F6',
  star: '#A5F3FC',
  grid: 'rgba(90, 170, 255, 0.12)',
  axis: '#8EA6CF',
  warning: '#FBBF24',
};

export const axisProps = {
  stroke: CHART_COLORS.axis,
  tick: { fill: CHART_COLORS.axis, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' },
  tickLine: false,
  axisLine: { stroke: CHART_COLORS.grid },
};

export const gridProps = { stroke: CHART_COLORS.grid, strokeDasharray: '3 6', vertical: false };

export const tooltipProps = {
  contentStyle: {
    background: 'rgba(6, 16, 38, 0.95)',
    border: '1px solid rgba(90, 170, 255, 0.4)',
    borderRadius: 12,
    color: '#E6F0FF',
    fontSize: 12,
    boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)',
  },
  labelStyle: { color: '#8EA6CF', fontFamily: 'JetBrains Mono, monospace', fontSize: 11 },
  itemStyle: { color: '#E6F0FF' },
  cursor: { stroke: 'rgba(165, 243, 252, 0.4)', strokeWidth: 1 },
};
