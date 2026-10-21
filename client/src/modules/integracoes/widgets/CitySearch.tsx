import type { CityLocation } from '@polaris/shared';
import { useQuery } from '@tanstack/react-query';
import { Loader2, MapPin, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Input } from '../../../components/ui/Input';
import { api } from '../../../lib/api';
import type { WidgetProps } from './types';

/** Campo de cidade com busca no geocoding do Open-Meteo. */
export function CitySearch({ id, value, onChange }: WidgetProps) {
  const city = value as CityLocation | null;
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 400);
    return () => clearTimeout(timer);
  }, [query]);

  const results = useQuery({
    queryKey: ['geocode', debounced],
    queryFn: () =>
      api.get<CityLocation[]>(`/integrations/open-meteo/geocode?q=${encodeURIComponent(debounced)}`),
    enabled: debounced.length >= 2,
  });

  const describe = (c: CityLocation) => [c.name, c.admin1, c.country].filter(Boolean).join(', ');

  return (
    <div className="space-y-2">
      {city && (
        <div className="flex items-center gap-2 rounded-xl border border-primary/50 bg-primary/10 px-3 py-2 text-sm">
          <MapPin className="h-4 w-4 text-primary" aria-hidden />
          <span className="flex-1">{describe(city)}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remover cidade"
            className="text-text-dim hover:text-danger"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-dim"
          aria-hidden
        />
        <Input
          id={id}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={city ? 'Trocar de cidade…' : 'Digite o nome da cidade…'}
          className="pl-9"
          autoComplete="off"
        />
        {results.isFetching && (
          <Loader2
            className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-primary"
            aria-hidden
          />
        )}
      </div>
      {debounced.length >= 2 && results.data && (
        <ul className="max-h-56 overflow-y-auto rounded-xl border border-border bg-bg-deep/80">
          {results.data.length === 0 && (
            <li className="p-3 text-sm text-text-dim">Nenhuma cidade encontrada.</li>
          )}
          {results.data.map((c) => (
            <li key={`${c.latitude},${c.longitude}`}>
              <button
                type="button"
                onClick={() => {
                  onChange(c);
                  setQuery('');
                  setDebounced('');
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-primary/10 hover:text-star"
              >
                <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden /> {describe(c)}
              </button>
            </li>
          ))}
        </ul>
      )}
      {results.isError && <p className="text-xs text-danger">Não foi possível buscar cidades agora.</p>}
    </div>
  );
}
