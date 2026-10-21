import type { ComponentType } from 'react';
import { CitySearch } from './CitySearch';
import type { WidgetProps } from './types';

/** Widgets especiais de campo, escolhidos pelo "widget" definido no schema da integração. */
export const FIELD_WIDGETS: Record<string, ComponentType<WidgetProps>> = {
  'city-search': CitySearch,
};
