import { Component, inject } from '@angular/core';
import { AuthStore } from '../auth/auth-store';
import { DASHBOARD_STRINGS } from './dashboard.strings';

/**
 * The one screen behind the admin gate for this slice: a placeholder that greets the signed-in
 * subject (read from the token, display-only). No data endpoint — a real screen arrives once
 * persistence returns to the host. Navigation and sign-out now live in the admin shell (AdminShell
 * / ShellTopbar) that wraps this route, not on the screen itself.
 */
@Component({
  selector: 'nb-dashboard',
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly authStore = inject(AuthStore);

  protected readonly strings = DASHBOARD_STRINGS;
  protected readonly subject = this.authStore.subject;
}
