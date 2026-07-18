import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Shell } from 'common';
import { AuthStore } from '../auth/auth-store';
import { DASHBOARD_STRINGS } from '../dashboard/dashboard.strings';
import { ADMIN_MENU } from './admin-menu';

/**
 * Mounts the common `Shell` for every authenticated admin route (see app.routes.ts — this is the
 * route-level wrapper component, `/login` is a sibling route outside it). Owns what `Shell` itself
 * must not know about: the concrete nav model and the sign-out action, projected into the shell's
 * topbar. Locale switching is baked into `Shell`'s topbar directly (generic engine capability);
 * sign-out is admin/auth-specific and has no home in `common`.
 */
@Component({
  selector: 'nb-admin-shell',
  imports: [Shell, ButtonModule],
  template: `
    <nb-shell [menu]="menu">
      <p-button [label]="strings.logout" severity="secondary" size="small" (onClick)="logout()" />
    </nb-shell>
  `,
})
export class AdminShell {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly menu = ADMIN_MENU;
  protected readonly strings = DASHBOARD_STRINGS;

  protected logout(): void {
    this.authStore.logout();
    this.router.navigate(['/login']);
  }
}
