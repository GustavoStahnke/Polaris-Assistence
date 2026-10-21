import type { IntegrationView } from '@polaris/shared';

/** Propriedades recebidas por um widget de campo do formulário de configuração. */
export interface WidgetProps {
  id: string;
  value: unknown;
  onChange: (value: unknown) => void;
  integration: IntegrationView;
  /** Valores atuais do formulário inteiro (alguns widgets dependem de outros campos). */
  values: Record<string, unknown>;
}
