import type { IntegrationView } from '@polaris/shared';
import { SECRET_MASK } from '@polaris/shared';
import { Field, Input, Select, Switch, Textarea } from '../../components/ui/Input';
import { FIELD_WIDGETS } from './widgets/registry';

interface JsonProperty {
  type?: string | string[];
  title?: string;
  description?: string;
  enum?: string[];
  enumLabels?: Record<string, string>;
  widget?: string;
  secret?: boolean;
  minimum?: number;
  maximum?: number;
  items?: { type?: string };
}

/**
 * Formulário gerado automaticamente a partir do JSON Schema da integração
 * (que por sua vez vem do schema zod definido no servidor).
 */
export function SchemaForm({
  integration,
  values,
  onChange,
}: {
  integration: IntegrationView;
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
}) {
  const properties = (integration.configSchema?.properties ?? {}) as Record<string, JsonProperty>;
  const set = (key: string, value: unknown) => onChange({ ...values, [key]: value });

  return (
    <div className="space-y-5">
      {Object.entries(properties).map(([key, prop]) => {
        const label = prop.title ?? key;
        const Widget = prop.widget ? FIELD_WIDGETS[prop.widget] : undefined;
        const value = values[key];

        if (Widget) {
          return (
            <Field key={key} label={label} hint={prop.description}>
              {(id) => (
                <Widget
                  id={id}
                  value={value}
                  onChange={(v) => set(key, v)}
                  integration={integration}
                  values={values}
                />
              )}
            </Field>
          );
        }

        if (prop.enum) {
          return (
            <Field key={key} label={label} hint={prop.description}>
              {(id) => (
                <Select id={id} value={String(value ?? '')} onChange={(e) => set(key, e.target.value)}>
                  {prop.enum!.map((option) => (
                    <option key={option} value={option}>
                      {prop.enumLabels?.[option] ?? option}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          );
        }

        if (prop.type === 'boolean') {
          return (
            <div key={key} className="flex items-center justify-between gap-4">
              <div>
                <p className="label-mono text-text-dim">{label}</p>
                {prop.description && <p className="mt-1 text-xs text-text-dim">{prop.description}</p>}
              </div>
              <Switch checked={Boolean(value)} onChange={(v) => set(key, v)} label={label} />
            </div>
          );
        }

        if (prop.type === 'number' || prop.type === 'integer') {
          return (
            <Field key={key} label={label} hint={prop.description}>
              {(id) => (
                <Input
                  id={id}
                  type="number"
                  min={prop.minimum}
                  max={prop.maximum}
                  value={value === undefined || value === null ? '' : String(value)}
                  onChange={(e) => set(key, e.target.value === '' ? undefined : Number(e.target.value))}
                />
              )}
            </Field>
          );
        }

        if (prop.type === 'array') {
          const list = Array.isArray(value) ? (value as string[]) : [];
          return (
            <Field key={key} label={label} hint={prop.description ?? 'Um item por linha.'}>
              {(id) => (
                <Textarea
                  id={id}
                  rows={4}
                  value={list.join('\n')}
                  onChange={(e) =>
                    set(
                      key,
                      e.target.value
                        .split('\n')
                        .map((line) => line.trim())
                        .filter(Boolean),
                    )
                  }
                />
              )}
            </Field>
          );
        }

        return (
          <Field key={key} label={label} hint={prop.description}>
            {(id) => (
              <Input
                id={id}
                type={prop.secret ? 'password' : 'text'}
                autoComplete="off"
                value={String(value ?? '')}
                onFocus={(e) => prop.secret && e.target.value === SECRET_MASK && set(key, '')}
                onChange={(e) => set(key, e.target.value)}
              />
            )}
          </Field>
        );
      })}
    </div>
  );
}
