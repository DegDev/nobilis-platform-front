import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { decodeJwtSubject } from './jwt';

/** Admin login response body — mirrors the backend `LoginResponse` record. */
interface LoginResponse {
  token: string;
}

/**
 * Holds the admin session token and talks to the login endpoint.
 *
 * The token lives in a signal (the source of truth for change detection) mirrored into
 * `sessionStorage` so a reload keeps the session; `sessionStorage` (not `localStorage`) scopes it
 * to the tab and clears when the tab closes. The token is never verified client-side — that is the
 * backend gate's job; here it only drives routing and a display-only subject.
 */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private static readonly STORAGE_KEY = 'nb-admin-token';

  private readonly http = inject(HttpClient);
  private readonly tokenSignal = signal<string | null>(
    sessionStorage.getItem(AuthStore.STORAGE_KEY),
  );

  readonly token = this.tokenSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.tokenSignal() !== null);
  readonly subject = computed(() => {
    const token = this.tokenSignal();
    return token ? decodeJwtSubject(token) : null;
  });

  /** Authenticates against the backend and stores the returned token on success. */
  login(email: string, password: string): Observable<void> {
    return this.http.post<LoginResponse>('/auth/admin/login', { email, password }).pipe(
      tap((response) => this.setToken(response.token)),
      map(() => undefined),
    );
  }

  logout(): void {
    this.setToken(null);
  }

  private setToken(token: string | null): void {
    this.tokenSignal.set(token);
    if (token) {
      sessionStorage.setItem(AuthStore.STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(AuthStore.STORAGE_KEY);
    }
  }
}
