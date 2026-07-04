import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { PageableQuery, PagedModel, toHttpParams } from 'common';
import { Observable, map } from 'rxjs';
import { AccountModel, AccountUpdateRequest, RoleRef } from './account';

/**
 * Talks to the admin accounts REST API (`/admin/api/accounts`) — the third consumer of the common
 * CRUD kit's HTTP contract, after settings and roles. Same contract: `PagedModel` list responses,
 * `PageableQuery` params, `ProblemDetailError` (global interceptor) and the Bearer token attached by
 * the admin `authInterceptor`. Rows are keyed by numeric `id`. There is no create or delete call —
 * this screen manages existing accounts, and a soft delete is a `PUT` with `status = BLOCKED` (a
 * `get` is unnecessary too: the list row already carries the full account). The roles catalog is
 * fetched from the roles API to feed the roles multiselect's options.
 */
@Injectable({ providedIn: 'root' })
export class AccountsApi {
  private static readonly BASE = '/admin/api/accounts';
  private static readonly ROLES = '/admin/api/roles';

  private readonly http = inject(HttpClient);

  /** Lists accounts, one page at a time. */
  list(query: PageableQuery): Observable<PagedModel<AccountModel>> {
    return this.http.get<PagedModel<AccountModel>>(AccountsApi.BASE, {
      params: toHttpParams(query),
    });
  }

  /** Updates an account's status, realms and roles (roles by id; a soft delete is `status=BLOCKED`). */
  update(id: number, request: AccountUpdateRequest): Observable<AccountModel> {
    return this.http.put<AccountModel>(`${AccountsApi.BASE}/${id}`, request);
  }

  /**
   * Fetches the roles catalog as options for the roles multiselect (id + code + name). One large
   * page suffices — the engine's role catalog is small; a domain product with many roles would page.
   */
  getRolesForOptions(): Observable<RoleRef[]> {
    const params = toHttpParams({ page: 0, size: 200, sort: ['code'] });
    return this.http
      .get<PagedModel<RoleRef>>(AccountsApi.ROLES, { params })
      .pipe(map((page) => page.content.map((r) => ({ id: r.id, code: r.code, name: r.name }))));
  }
}
