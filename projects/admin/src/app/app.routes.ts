import { Routes } from '@angular/router';
import { authGuard } from './auth/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then((m) => m.Login),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shell/admin-shell').then((m) => m.AdminShell),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard').then((m) => m.Dashboard),
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/settings-page').then((m) => m.SettingsPage),
      },
      {
        path: 'roles',
        loadComponent: () => import('./roles/roles-page').then((m) => m.RolesPage),
      },
      {
        path: 'accounts',
        loadComponent: () => import('./accounts/accounts-page').then((m) => m.AccountsPage),
      },
      {
        path: 'content-blocks',
        loadComponent: () => import('./cms/content-blocks-page').then((m) => m.ContentBlocksPage),
      },
      {
        path: 'integrations',
        loadComponent: () =>
          import('./integrations/integrations-page').then((m) => m.IntegrationsPage),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./notifications/notifications-page').then((m) => m.NotificationsPage),
      },
      {
        path: 'ai-llm',
        loadComponent: () => import('./ai-llm/ai-llm-page').then((m) => m.AiLlmPage),
      },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
