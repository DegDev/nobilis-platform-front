import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of } from 'rxjs';

/**
 * Thin wrapper over the portal's public CMS read path (`GET /api/content/{key}`). Local to `app`,
 * not `common`: this is portal UI talking to the portal's own public endpoint, not a shared kit
 * contract. A `404` (the key isn't PUBLISHED yet, or doesn't exist) is an expected, normal outcome
 * here — not an error — so it resolves to `null` rather than throwing, letting callers render a
 * graceful empty state instead of failing the page.
 */
@Injectable({ providedIn: 'root' })
export class PortalContentApi {
  private static readonly BASE = '/api/content';

  private readonly http = inject(HttpClient);

  /** Reads a published content block's body, or `null` if it isn't published (or doesn't exist). */
  read(key: string): Observable<string | null> {
    return this.http
      .get(`${PortalContentApi.BASE}/${encodeURIComponent(key)}`, { responseType: 'text' })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 404) {
            return of(null);
          }
          throw error;
        }),
      );
  }
}
