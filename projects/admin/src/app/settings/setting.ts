/**
 * The admin API view of an engine setting — mirrors the backend `SettingDto`. A secret's value is
 * NEVER sent back on a read path: `value` is `null` when `secret` is true (masked at the source), so
 * the UI tells "unset" from "hidden secret" by the `secret` flag, never by a fake value.
 */
export interface Setting {
  readonly key: string;
  readonly value: string | null;
  readonly secret: boolean;
}

/** Body for `POST /admin/api/settings` — mirrors the backend `SettingCreateRequest` (plaintext value). */
export interface SettingCreateRequest {
  readonly key: string;
  readonly value: string;
  readonly secret: boolean;
}

/** Body for `PUT /admin/api/settings/{key}` — mirrors the backend `SettingUpdateRequest` (plaintext value). */
export interface SettingUpdateRequest {
  readonly value: string;
  readonly secret: boolean;
}
