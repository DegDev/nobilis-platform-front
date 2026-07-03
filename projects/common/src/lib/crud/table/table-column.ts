/**
 * A table column configured AS DATA (no metadata engine). `field` indexes the row object for the
 * default cell; supply a custom cell for a column via the `nbColumnCell` template escape hatch.
 * Labels come from the caller (i18n stays with the consumer — the library ships no UI strings).
 */
export interface TableColumn {
  readonly field: string;
  readonly header: string;
  readonly sortable?: boolean;
}

/** A row action rendered as a button in a trailing actions column; emits its `id` on click. */
export interface TableAction {
  readonly id: string;
  readonly label: string;
  readonly icon?: string;
  readonly severity?: 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast';
}

/** The payload of the table's row-action output: which action, on which row. */
export interface TableActionEvent<T> {
  readonly action: string;
  readonly row: T;
}
