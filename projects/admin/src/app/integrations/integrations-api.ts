import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { PagedModel, toHttpParams } from 'common';
import { Observable } from 'rxjs';
import { INTEGRATION_KEY_PREFIX, IntegrationSetting } from './integration';

/**
 * Talks to the existing admin settings REST API (`/admin/api/settings`), the same endpoint the
 * settings screen uses — the Integrations screen adds no new backend surface (see the paired
 * backend plan), just a `keyPrefix` query param and reuse of the existing PUT-upsert write path.
 */
@Injectable({ providedIn: 'root' })
export class IntegrationsApi {
  private static readonly BASE = '/admin/api/settings';
  // Providers are admin-curated and few; one generously-sized page avoids adding paging UI for this pass.
  private static readonly LIST_SIZE = 200;

  private readonly http = inject(HttpClient);

  /** Lists every `integration.*` setting (secret values arrive masked as `null`). */
  list(): Observable<PagedModel<IntegrationSetting>> {
    const params = toHttpParams({ page: 0, size: IntegrationsApi.LIST_SIZE, sort: [] }).set(
      'keyPrefix',
      INTEGRATION_KEY_PREFIX,
    );
    return this.http.get<PagedModel<IntegrationSetting>>(IntegrationsApi.BASE, { params });
  }

  /** Sets (creates or replaces) a provider's secret; always stored encrypted. */
  set(key: string, value: string): Observable<IntegrationSetting> {
    return this.http.put<IntegrationSetting>(`${IntegrationsApi.BASE}/${encodeURIComponent(key)}`, {
      value,
      secret: true,
    });
  }
}
