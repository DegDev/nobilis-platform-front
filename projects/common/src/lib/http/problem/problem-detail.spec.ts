import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { fieldErrorsByKey, parseProblemDetail } from './problem-detail';

function errorResponse(body: unknown, contentType: string, status = 400): HttpErrorResponse {
  return new HttpErrorResponse({
    error: body,
    status,
    headers: new HttpHeaders({ 'content-type': contentType }),
  });
}

describe('parseProblemDetail', () => {
  it('parses a problem+json body carrying fieldErrors', () => {
    const problem = parseProblemDetail(
      errorResponse(
        { title: 'Bad Request', status: 400, fieldErrors: [{ field: 'key', message: 'blank' }] },
        'application/problem+json',
      ),
    );

    expect(problem?.status).toBe(400);
    expect(problem?.fieldErrors?.[0].field).toBe('key');
  });

  it('parses a problem without fieldErrors', () => {
    const problem = parseProblemDetail(
      errorResponse({ title: 'Not Found', status: 404 }, 'application/problem+json', 404),
    );

    expect(problem?.title).toBe('Not Found');
    expect(problem?.fieldErrors).toBeUndefined();
  });

  it('returns null for a non-problem error (no content type, no status field)', () => {
    expect(parseProblemDetail(errorResponse('boom', 'text/plain', 500))).toBeNull();
  });

  it('falls back to a structural check when the content type is stripped', () => {
    const problem = parseProblemDetail(
      errorResponse({ status: 400, title: 'x' }, 'application/json'),
    );

    expect(problem?.status).toBe(400);
  });
});

describe('fieldErrorsByKey', () => {
  it('indexes field errors by field name', () => {
    const byKey = fieldErrorsByKey({
      fieldErrors: [
        { field: 'a', message: 'A' },
        { field: 'b', message: 'B' },
      ],
    });

    expect(byKey).toEqual({ a: 'A', b: 'B' });
  });

  it('returns an empty map for null', () => {
    expect(fieldErrorsByKey(null)).toEqual({});
  });
});
