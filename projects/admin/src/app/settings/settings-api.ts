import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { PageableQuery, PagedModel, toHttpParams } from 'common';
import { Observable } from 'rxjs';
import { Setting, SettingCreateRequest, SettingUpdateRequest } from './setting';

/**
 * Talks to the admin settings REST API (`/api/admin/settings`) — the first consumer of the common
 * CRUD kit's HTTP contract: `PagedModel` list responses and `PageableQuery` request params. Errors
 * surface as the common `ProblemDetailError` (the problem interceptor is registered globally) and
 * the Bearer token is attached by the admin `authInterceptor`; this stays a thin, stateless
 * HttpClient wrapper.
 */
@Injectable({ providedIn: 'root' })
export class SettingsApi {
  private static readonly BASE = '/api/admin/settings';

  private readonly http = inject(HttpClient);

  /** Lists settings, one page at a time (secret values arrive masked as `null`). */
  list(query: PageableQuery): Observable<PagedModel<Setting>> {
    return this.http.get<PagedModel<Setting>>(SettingsApi.BASE, { params: toHttpParams(query) });
  }

  /** Creates a setting; the backend encrypts the value first when `secret`. */
  create(request: SettingCreateRequest): Observable<Setting> {
    return this.http.post<Setting>(SettingsApi.BASE, request);
  }

  /** Upserts the setting at `key` (PUT is idempotent); overwrites the stored value. */
  update(key: string, request: SettingUpdateRequest): Observable<Setting> {
    return this.http.put<Setting>(`${SettingsApi.BASE}/${encodeURIComponent(key)}`, request);
  }

  /** Deletes the setting at `key`. */
  delete(key: string): Observable<void> {
    return this.http.delete<void>(`${SettingsApi.BASE}/${encodeURIComponent(key)}`);
  }
}
