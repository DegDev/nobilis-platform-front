import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ProblemDetailError, parseProblemDetail } from './problem-detail';

/**
 * Opt-in functional interceptor: when a failed response carries an RFC 9457 problem+json body, it
 * rethrows a typed {@link ProblemDetailError} so a caller's error branch receives the parsed problem
 * (title, status, fieldErrors) instead of a raw {@link HttpErrorResponse}. Anything that is not a
 * problem passes through unchanged — nothing is force-wrapped.
 *
 * <p>Register it explicitly (opt-in, never global by default):
 * `provideHttpClient(withInterceptors([problemDetailInterceptor]))`.
 */
export const problemDetailInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const problem = parseProblemDetail(error);
        if (problem) {
          return throwError(() => new ProblemDetailError(problem, error));
        }
      }
      return throwError(() => error);
    }),
  );
