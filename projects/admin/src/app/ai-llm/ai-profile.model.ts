/** Wire shapes for the AI-profile admin API (`/admin/api/ai`), mirroring the backend's records. */

export type AiFieldCategory = 'INFRA' | 'OPERATIONAL' | 'SECRET';
export type AiFieldType = 'STRING' | 'NUMBER' | 'BOOLEAN';

/** One provider offered for a purpose. */
export interface AiProvider {
  readonly code: string;
  readonly label: string;
  readonly hint: string | null;
  readonly requiresLocal: boolean;
}

/**
 * One catalog field's metadata — what the data-driven form renders from. `defaultValue`/
 * `minValue`/`maxValue` arrive as strings/numbers per the backend's `AiFieldDescriptor` JSON.
 */
export interface AiFieldDescriptor {
  readonly fieldKey: string;
  readonly category: AiFieldCategory;
  readonly type: AiFieldType;
  readonly editable: boolean;
  readonly defaultValue: string | null;
  readonly minValue: number | null;
  readonly maxValue: number | null;
  readonly options: readonly string[];
}

/** The resolved, masked profile for a purpose — `secretsSet` reports presence only, never a value. */
export interface AiProfile {
  readonly purpose: string;
  readonly providerCode: string;
  readonly params: Record<string, string>;
  readonly secretsSet: Record<string, boolean>;
}

/** A save request: `params` for INFRA/OPERATIONAL fields, `secrets` for SECRET fields (write-only). */
export interface AiProfileSaveRequest {
  readonly purpose: string;
  readonly provider: string;
  readonly params: Record<string, string>;
  readonly secrets: Record<string, string>;
}

export interface AiHealthCheckResult {
  readonly ok: boolean;
  readonly message: string;
}
