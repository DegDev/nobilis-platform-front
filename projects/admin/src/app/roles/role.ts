/**
 * The admin API view of a role — mirrors the backend `RoleDto`. `code` is the immutable business
 * key (set once at create, never sent on update); `permissions` are engine permission values drawn
 * from the catalog (`GET /admin/api/roles/permissions`). Rows are addressed by numeric `id`.
 */
export interface RoleModel {
  readonly id: number;
  readonly code: string;
  readonly name: string;
  readonly permissions: readonly string[];
}

/** Body for `POST /admin/api/roles` — mirrors the backend `RoleCreateRequest`. */
export interface RoleCreateRequest {
  readonly code: string;
  readonly name: string;
  readonly permissions: string[];
}

/**
 * Body for `PUT /admin/api/roles/{id}` — mirrors the backend `RoleUpdateRequest`. No `code`: it is
 * the immutable business key and is never part of an update, only the label and permission set.
 */
export interface RoleUpdateRequest {
  readonly name: string;
  readonly permissions: string[];
}
