import { HttpErrorResponse } from '@angular/common/http';

/** One field-level validation error from an RFC 9457 problem+json body's `fieldErrors` array. */
export interface FieldError {
  readonly field: string;
  readonly message: string;
}

/**
 * An RFC 9457 Problem Details payload (`application/problem+json`) plus the engine's `fieldErrors`
 * extension. This mirrors what the backend's `GlobalExceptionHandler` emits: `title`/`status`/`detail`
 * for every error and, on a 400, a `fieldErrors` array a form maps to per-field messages.
 */
export interface ProblemDetail {
  readonly type?: string;
  readonly title?: string;
  readonly status?: number;
  readonly detail?: string;
  readonly instance?: string;
  readonly fieldErrors?: readonly FieldError[];
}

const PROBLEM_JSON = 'application/problem+json';

/**
 * Extracts an RFC 9457 problem from an {@link HttpErrorResponse}, or `null` when the response is not
 * problem+json. Recognises the `application/problem+json` content type, falling back to a structural
 * check (an object body carrying a numeric `status`) so a stripped content type still parses.
 */
export function parseProblemDetail(error: HttpErrorResponse): ProblemDetail | null {
  const body = error.error as Record<string, unknown> | null | undefined;
  if (!body || typeof body !== 'object') {
    return null;
  }
  const contentType = error.headers.get('content-type') ?? '';
  if (!contentType.includes(PROBLEM_JSON) && typeof body['status'] !== 'number') {
    return null;
  }
  return body as ProblemDetail;
}

/**
 * Indexes a problem's field errors by field name, so a form can look up the message for a given
 * field in O(1). Returns an empty map when there are no field errors.
 */
export function fieldErrorsByKey(problem: ProblemDetail | null): Record<string, string> {
  const byKey: Record<string, string> = {};
  for (const fieldError of problem?.fieldErrors ?? []) {
    byKey[fieldError.field] = fieldError.message;
  }
  return byKey;
}

/**
 * A typed error carrying a parsed {@link ProblemDetail} and the originating response. Thrown by
 * {@link problemDetailInterceptor} so a subscriber's error branch receives the problem directly.
 */
export class ProblemDetailError extends Error {
  constructor(
    readonly problem: ProblemDetail,
    readonly response: HttpErrorResponse,
  ) {
    super(problem.detail ?? problem.title ?? 'Request failed');
    this.name = 'ProblemDetailError';
  }
}
