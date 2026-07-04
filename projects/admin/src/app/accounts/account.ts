/** Account lifecycle status — mirrors the backend `AccountStatus` enum. */
export type AccountStatus = 'ACTIVE' | 'BLOCKED' | 'PENDING';

/** Coarse membership realm — mirrors the backend `Realm` enum. */
export type Realm = 'ADMIN' | 'CLIENT';

/**
 * A role assigned to an account — mirrors the backend `AccountDto.RoleRef`: a lean id + code/name,
 * deliberately without the role's permission set. The `id` is what an update submits back.
 */
export interface RoleRef {
  readonly id: number;
  readonly code: string;
  readonly name: string;
}

/**
 * One identity binding of an account — mirrors the backend `AccountDto.IdentityRef`: the provider
 * and its external id ONLY. The stored secret hash never crosses the wire (it is not a field on the
 * backend DTO); do NOT add a secret/hash field here.
 */
export interface IdentityRef {
  readonly provider: string;
  readonly externalId: string;
}

/**
 * The admin API view of an account — mirrors the backend `AccountDto`. This screen manages `status`,
 * `realms` and `roles`; `identities` are display-only (identity/login management is a later
 * milestone). Rows are addressed by numeric `id`.
 */
export interface AccountModel {
  readonly id: number;
  readonly status: AccountStatus;
  readonly realms: readonly Realm[];
  readonly roles: readonly RoleRef[];
  readonly identities: readonly IdentityRef[];
}

/**
 * Body for `PUT /admin/api/accounts/{id}` — mirrors the backend `AccountUpdateRequest`. Roles are
 * referenced by **id** (not code), realms by enum **name**. There is no create or delete verb — a
 * soft delete is this request with `status = BLOCKED`.
 */
export interface AccountUpdateRequest {
  readonly status: AccountStatus;
  readonly realms: string[];
  readonly roleIds: number[];
}
