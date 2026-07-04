import { Component, inject, signal } from '@angular/core';
import { FormField, email, form, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { AuthStore } from '../auth-store';
import { LOGIN_STRINGS } from './login.strings';

/**
 * Admin login screen: a Signal Forms email/password form styled with PrimeNG. On success it stores
 * the thick token (via {@link AuthStore}) and routes to the dashboard; a rejected credential shows
 * an inline error. The form is Signal Forms bound to native inputs carrying the PrimeNG
 * `pInputText` directive (see the note in the build report on the p-password interop decision).
 */
@Component({
  selector: 'nb-login',
  imports: [FormField, InputTextModule, ButtonModule, MessageModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly strings = LOGIN_STRINGS;
  protected readonly failed = signal(false);
  protected readonly submitting = signal(false);

  protected readonly model = signal({ email: '', password: '' });
  protected readonly loginForm = form(this.model, (path) => {
    required(path.email, { message: LOGIN_STRINGS.emailRequired });
    email(path.email, { message: LOGIN_STRINGS.emailInvalid });
    required(path.password, { message: LOGIN_STRINGS.passwordRequired });
  });

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (this.loginForm().invalid() || this.submitting()) {
      return;
    }
    this.failed.set(false);
    this.submitting.set(true);
    const credentials = this.model();
    this.authStore.login(credentials.email, credentials.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.failed.set(true);
        this.submitting.set(false);
      },
    });
  }
}
