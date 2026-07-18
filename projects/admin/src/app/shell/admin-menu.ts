import { MenuItem } from 'primeng/api';
import { DASHBOARD_STRINGS } from '../dashboard/dashboard.strings';
import { SETTINGS_STRINGS } from '../settings/settings.strings';
import { ROLES_STRINGS } from '../roles/roles.strings';
import { ACCOUNTS_STRINGS } from '../accounts/accounts.strings';
import { CONTENT_BLOCKS_STRINGS } from '../cms/content-blocks.strings';
import { INTEGRATIONS_STRINGS } from '../integrations/integrations.strings';
import { NOTIFICATIONS_STRINGS } from '../notifications/notifications.strings';
import { AI_LLM_STRINGS } from '../ai-llm/ai-llm.strings';
import { ADMIN_MENU_STRINGS } from './admin-menu.strings';

/**
 * The admin sidebar nav model, carrying the same destinations the old dashboard button-grid did.
 * A plain `MenuItem[]` (matching {@link Shell}'s slice-1 API) — the typed nav-model contract
 * replacing this shape is slice 3 (nav-as-data, resolves BL-004 in the backend repo), not this one.
 * Every label reuses its target screen's own `*_STRINGS.title` rather than introducing new strings.
 */
export const ADMIN_MENU: MenuItem[] = [
  {
    label: ADMIN_MENU_STRINGS.section,
    items: [
      { label: DASHBOARD_STRINGS.title, icon: 'pi pi-fw pi-home', routerLink: ['/dashboard'] },
      { label: SETTINGS_STRINGS.title, icon: 'pi pi-fw pi-cog', routerLink: ['/settings'] },
      { label: ROLES_STRINGS.title, icon: 'pi pi-fw pi-users', routerLink: ['/roles'] },
      { label: ACCOUNTS_STRINGS.title, icon: 'pi pi-fw pi-id-card', routerLink: ['/accounts'] },
      {
        label: CONTENT_BLOCKS_STRINGS.title,
        icon: 'pi pi-fw pi-file-edit',
        routerLink: ['/content-blocks'],
      },
      {
        label: INTEGRATIONS_STRINGS.title,
        icon: 'pi pi-fw pi-plug',
        routerLink: ['/integrations'],
      },
      {
        label: NOTIFICATIONS_STRINGS.title,
        icon: 'pi pi-fw pi-bell',
        routerLink: ['/notifications'],
      },
      { label: AI_LLM_STRINGS.title, icon: 'pi pi-fw pi-microchip-ai', routerLink: ['/ai-llm'] },
    ],
  },
];
