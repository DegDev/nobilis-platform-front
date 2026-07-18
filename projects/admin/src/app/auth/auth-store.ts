import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, finalize, map, shareReplay, tap } from 'rxjs';
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
  /**
   * Coalesces concurrent re-mint calls (e.g. several requests hitting a near-expiry token at once,
   * such as a tab waking from idle) into a single backend round-trip. `shareReplay(1)` multicasts the
   * one in-flight HTTP call to every caller; `finalize` clears the guard once it settles so the NEXT
   * re-mint cycle starts a fresh call rather than replaying a stale cached token forever.
   */
  private remintInFlight$: Observable<string> | null = null;

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

  /**
   * Silently re-mints the current token into a fresh one via the backend's stateless remint endpoint
   * (no DB round-trip). Presents the CURRENT token as the bearer credential — the remint endpoint is
   * exempt from the admin contour, so this must set the header explicitly rather than relying on
   * {@link authInterceptor}, which only stamps `/api/admin` requests.
   *
   * Concurrent callers share the one in-flight call (see {@link remintInFlight$}); each gets the same
   * fresh token once it resolves.
   */
  remint(): Observable<string> {
    if (this.remintInFlight$) {
      return this.remintInFlight$;
    }
    const current = this.tokenSignal();
    const headers = current ? new HttpHeaders({ Authorization: `Bearer ${current}` }) : undefined;
    const request$ = this.http.post<LoginResponse>('/auth/admin/remint', null, { headers }).pipe(
      map((response) => response.token),
      tap((token) => this.setToken(token)),
      finalize(() => (this.remintInFlight$ = null)),
      shareReplay(1),
    );
    this.remintInFlight$ = request$;
    return request$;
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
