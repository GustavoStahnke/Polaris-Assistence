import type { IntegrationView } from '@polaris/shared';
import { createElement } from 'react';
import { iconByName } from '../../lib/icons';
import { STATUS_META } from './status';

const WIDTH = 720;
const HEIGHT = 340;
const CX = WIDTH / 2;
const CY = HEIGHT / 2;

/**
 * Mapa de conexões: o Núcleo Polaris no centro e uma linha luminosa até cada integração.
 * Conectadas brilham em ciano, com erro em vermelho, desativadas ficam apagadas.
 */
export function ConnectionMap({ integrations }: { integrations: IntegrationView[] }) {
  const nodes = integrations.map((integration, i) => {
    const angle = (i / integrations.length) * Math.PI * 2 - Math.PI / 2;
    return { integration, x: CX + Math.cos(angle) * 290, y: CY + Math.sin(angle) * 130 };
  });

  return (
    <div className="glass overflow-hidden p-2">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full"
        role="img"
        aria-label="Mapa de conexões"
      >
        <defs>
          <radialGradient id="map-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#A5F3FC" />
            <stop offset="100%" stopColor="rgba(56,189,248,0)" />
          </radialGradient>
          {/* userSpaceOnUse: sem isso, o brilho some em linhas retas verticais/horizontais (caixa de largura zero). */}
          <filter id="map-glow" filterUnits="userSpaceOnUse" x="0" y="0" width={WIDTH} height={HEIGHT}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {nodes.map(({ integration, x, y }) => {
          const meta = STATUS_META[integration.status];
          const active = integration.status === 'conectada';
          const problem = integration.status === 'erro' || integration.status === 'expirada';
          const faint = !active && !problem;
          return (
            <line
              key={`line-${integration.id}`}
              x1={CX}
              y1={CY}
              x2={x}
              y2={y}
              stroke={meta.color}
              strokeWidth={active || problem ? 1.6 : 1}
              strokeOpacity={faint ? (integration.status === 'em_breve' ? 0.12 : 0.25) : 0.85}
              strokeDasharray={active ? '6 6' : faint ? '2 6' : undefined}
              filter={active || problem ? 'url(#map-glow)' : undefined}
            >
              {active && (
                <animate
                  attributeName="stroke-dashoffset"
                  from="24"
                  to="0"
                  dur="1.2s"
                  repeatCount="indefinite"
                />
              )}
            </line>
          );
        })}

        <circle cx={CX} cy={CY} r={46} fill="url(#map-core)" opacity={0.55} />
        <path
          d={`M${CX} ${CY - 26} L${CX + 5} ${CY - 5} L${CX + 26} ${CY} L${CX + 5} ${CY + 5} L${CX} ${CY + 26} L${CX - 5} ${CY + 5} L${CX - 26} ${CY} L${CX - 5} ${CY - 5} Z`}
          fill="#E6F0FF"
          filter="url(#map-glow)"
        />

        {nodes.map(({ integration, x, y }) => {
          const meta = STATUS_META[integration.status];
          const dim = integration.status === 'em_breve' || integration.status === 'desativada';
          return (
            <g key={integration.id} opacity={dim ? 0.45 : 1}>
              <circle cx={x} cy={y} r={20} fill="#061026" stroke={meta.color} strokeWidth={1.4} />
              {createElement(iconByName(integration.icon), {
                x: x - 9,
                y: y - 9,
                width: 18,
                height: 18,
                color: meta.color,
              })}
              <text
                x={x}
                y={y + 34}
                textAnchor="middle"
                fill="#8EA6CF"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                letterSpacing="0.08em"
              >
                {integration.name.length > 18 ? `${integration.name.slice(0, 16)}…` : integration.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
