import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthStore } from './auth-store';
import { decodeJwtExp } from './jwt';

const ADMIN_API_PREFIX = '/api/admin';
/** A token with less than this much time left is silently re-minted before being attached. */
const PROACTIVE_REMINT_THRESHOLD_SECONDS = 5 * 60;

/**
 * Attaches the admin session token as a `Bearer` Authorization header to admin API requests
 * (`/api/admin/...`), which the backend gate (`JwtAuthenticationFilter`) reads. Only admin-api paths
 * are stamped: the login endpoint (`/auth/...`) has no token yet, and an anonymous request (no
 * token) passes through untouched so the gate can reject it.
 *
 * Two-layer silent token refresh sits on top of the plain attach:
 *  - PROACTIVE: if the token has less than {@link PROACTIVE_REMINT_THRESHOLD_SECONDS} left, re-mint
 *    it first and attach the fresh one — the common case, invisible to the request.
 *  - REACTIVE (safety net): if a request still goes out on an expired token (backgrounded tab,
 *    throttled timer, clock drift) and the backend answers 401, re-mint once and retry the original
 *    request once. If that re-mint also fails, the session is genuinely dead — log out and redirect
 *    to `/login` (the same fallback the `authGuard` route guard uses).
 *
 * Both layers call {@link AuthStore.remint}, which coalesces concurrent re-mint calls into one
 * backend round-trip (e.g. several requests waking at once from an idle tab).
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(ADMIN_API_PREFIX)) {
    return next(request);
  }
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const token = authStore.token();
  if (!token) {
    return next(request);
  }

  const onExpiredSession = (error: unknown): Observable<never> => {
    authStore.logout();
    router.navigateByUrl('/login');
    return throwError(() => error);
  };

  const sendWithReactiveRetry = (bearerToken: string): Observable<HttpEvent<unknown>> =>
    attach(request, next, bearerToken).pipe(
      catchError((error: unknown) => {
        if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
          return throwError(() => error);
        }
        return authStore.remint().pipe(
          switchMap((freshToken) => attach(request, next, freshToken)),
          catchError(onExpiredSession),
        );
      }),
    );

  const remaining = remainingSeconds(token);
  if (remaining === null || remaining >= PROACTIVE_REMINT_THRESHOLD_SECONDS) {
    return sendWithReactiveRetry(token);
  }
  return authStore.remint().pipe(
    switchMap((freshToken) => sendWithReactiveRetry(freshToken)),
    catchError(onExpiredSession),
  );
};

function attach(request: HttpRequest<unknown>, next: HttpHandlerFn, token: string) {
  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
}

function remainingSeconds(token: string): number | null {
  const exp = decodeJwtExp(token);
  return exp === null ? null : exp - Math.floor(Date.now() / 1000);
}
