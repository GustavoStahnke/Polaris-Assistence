import type { IntegrationView } from '@polaris/shared';
import type { ComponentType } from 'react';
import { FeedListPanel } from './FeedListPanel';

/** Painéis extras mostrados na gaveta de configuração (ex.: lista de feeds do RSS). */
export const EXTRA_PANELS: Record<
  string,
  { title: string; component: ComponentType<{ integration: IntegrationView }> }
> = {
  'feed-list': { title: 'Feeds', component: FeedListPanel },
};
