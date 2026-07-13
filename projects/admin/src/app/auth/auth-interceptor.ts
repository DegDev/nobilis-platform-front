import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from './auth-store';

/**
 * Attaches the admin session token as a `Bearer` Authorization header to admin API requests
 * (`/api/admin/...`), which the backend gate (`JwtAuthenticationFilter`) reads. Only admin-api paths
 * are stamped: the login endpoint (`/auth/...`) has no token yet, and an anonymous request (no
 * token) passes through untouched so the gate can reject it.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(AuthStore).token();
  if (token && request.url.startsWith('/api/admin')) {
    return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
  return next(request);
};
