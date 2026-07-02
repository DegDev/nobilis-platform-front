import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AuthStore } from '../auth/auth-store';
import { DASHBOARD_STRINGS } from './dashboard.strings';

/**
 * The one screen behind the admin gate for this slice: a placeholder that greets the signed-in
 * subject (read from the token, display-only) and offers sign-out. No data endpoint — a real
 * screen arrives once persistence returns to the host.
 */
@Component({
  selector: 'nb-dashboard',
  imports: [ButtonModule],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly strings = DASHBOARD_STRINGS;
  protected readonly subject = this.authStore.subject;

  protected logout(): void {
    this.authStore.logout();
    this.router.navigate(['/login']);
  }
}
