/** The kind of control rendered for a field. */
export type FormFieldType = 'text' | 'password' | 'number' | 'checkbox' | 'textarea' | 'select';

/** One choice for a `'select'` field. */
export interface FormFieldOption {
  readonly label: string;
  readonly value: string;
}

/**
 * One form field expressed AS DATA — its config and its current value together in a single record.
 * The whole form is therefore an ARRAY of these, which Signal Forms drives with `applyEach`: each
 * item's validation reads that item's own `required` flag (via `applyWhen`), so one static schema
 * fits any field list without knowing the config at form-construction time.
 *
 * <p>The caller seeds the array from its field config + the entity being edited and reads the edited
 * values back through the two-way `fields` model. Labels/messages come from the caller — the library
 * ships no UI strings.
 */
export interface FormFieldState {
  readonly key: string;
  readonly label: string;
  readonly type: FormFieldType;
  /**
   * Whether the field is required. Non-optional on purpose: it is a model property the schema reads
   * per item via `applyWhen`, and Signal Forms treats an OPTIONAL model property as a "maybe" path
   * that cannot be read in a schema. Set it explicitly (`false` for optional fields).
   */
  readonly required: boolean;
  readonly requiredMessage?: string;
  value: string | number | boolean | null;
  /** Choices for a `'select'` field; ignored for every other type. */
  readonly options?: readonly FormFieldOption[];
}
