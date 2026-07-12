import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LocaleStore } from './locale-store';

/**
 * Functional interceptor that stamps the active locale onto every outgoing request as
 * `?locale=<code>`, per the back↔front `?locale=` contract. Replaces an existing `locale` param
 * rather than duplicating it, and preserves every other existing query param.
 *
 * <p>Register it explicitly (opt-in, never global by default):
 * `provideHttpClient(withInterceptors([localeInterceptor]))`.
 */
export const localeInterceptor: HttpInterceptorFn = (request, next) => {
  const locale = inject(LocaleStore).locale();
  return next(request.clone({ setParams: { locale } }));
};
