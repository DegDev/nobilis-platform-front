import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { PageableQuery, PagedModel, toHttpParams } from 'common';
import { Observable } from 'rxjs';
import { RoleCreateRequest, RoleModel, RoleUpdateRequest } from './role';

/**
 * Talks to the admin roles REST API (`/api/admin/roles`) — the second consumer of the common CRUD
 * kit's HTTP contract after settings: `PagedModel` list responses and `PageableQuery` request
 * params. Errors surface as the common `ProblemDetailError` (the problem interceptor is registered
 * globally) and the Bearer token is attached by the admin `authInterceptor`. Rows are keyed by
 * numeric `id` (not the `code`), so update/delete address `/{id}`; this stays a thin, stateless
 * HttpClient wrapper.
 */
@Injectable({ providedIn: 'root' })
export class RolesApi {
  private static readonly BASE = '/api/admin/roles';

  private readonly http = inject(HttpClient);

  /** Lists roles, one page at a time. */
  list(query: PageableQuery): Observable<PagedModel<RoleModel>> {
    return this.http.get<PagedModel<RoleModel>>(RolesApi.BASE, { params: toHttpParams(query) });
  }

  /** Fetches the engine's catalog of assignable permissions (the multiselect options). */
  getPermissionCatalog(): Observable<string[]> {
    return this.http.get<string[]>(`${RolesApi.BASE}/permissions`);
  }

  /** Creates a role; `code` is set here and is immutable thereafter. */
  create(request: RoleCreateRequest): Observable<RoleModel> {
    return this.http.post<RoleModel>(RolesApi.BASE, request);
  }

  /** Updates a role's label and permissions (the immutable `code` is not sent). */
  update(id: number, request: RoleUpdateRequest): Observable<RoleModel> {
    return this.http.put<RoleModel>(`${RolesApi.BASE}/${id}`, request);
  }

  /** Deletes the role by id (the backend answers `409` when it is still assigned to accounts). */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${RolesApi.BASE}/${id}`);
  }
}
