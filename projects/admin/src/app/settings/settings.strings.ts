/**
 * User-visible strings for the settings screen, isolated in one place (same i18n seam rationale as
 * the login/dashboard strings — no hardcoded display strings in the templates).
 */
export const SETTINGS_STRINGS = {
  title: 'Settings',
  back: 'Back to dashboard',
  newSetting: 'New setting',

  // table columns + cells
  columnKey: 'Key',
  columnValue: 'Value',
  columnSecret: 'Secret',
  secretBadge: 'Secret',
  secretMask: 'Hidden',
  emptyValue: '—',
  edit: 'Edit',
  delete: 'Delete',

  // form fields
  fieldKey: 'Key',
  fieldValue: 'Value',
  fieldSecret: 'Store as secret (encrypted)',
  keyRequired: 'Key is required',

  // dialog
  createHeader: 'New setting',
  editHeader: 'Edit setting',
  save: 'Save',
  cancel: 'Cancel',
  secretEditHint:
    'This setting is stored as a secret; its value is hidden. Entering a value replaces the stored ' +
    'secret — saving with an empty value clears it.',

  // delete confirmation
  deleteConfirmHeader: 'Delete setting',
  deleteConfirmMessage: 'Delete this setting? This cannot be undone.',
  deleteConfirmYes: 'Delete',
  deleteConfirmNo: 'Cancel',
} as const;
