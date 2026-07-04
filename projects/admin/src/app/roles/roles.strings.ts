/**
 * User-visible strings for the roles screen, isolated in one place (same i18n seam rationale as the
 * settings/login strings — no hardcoded display strings in the templates).
 */
export const ROLES_STRINGS = {
  title: 'Roles',
  back: 'Back to dashboard',
  newRole: 'New role',

  // table columns + cells
  columnCode: 'Code',
  columnName: 'Name',
  columnPermissions: 'Permissions',
  noPermissions: 'None',
  edit: 'Edit',
  delete: 'Delete',

  // form fields
  fieldCode: 'Code',
  fieldName: 'Name',
  fieldPermissions: 'Permissions',
  codeRequired: 'Code is required',
  nameRequired: 'Name is required',
  permissionsPlaceholder: 'Select permissions',
  codeImmutableHint: 'The code is the role’s immutable key and cannot be changed.',

  // dialog
  createHeader: 'New role',
  editHeader: 'Edit role',
  save: 'Save',
  cancel: 'Cancel',

  // delete confirmation
  deleteConfirmHeader: 'Delete role',
  deleteConfirmMessage: 'Delete this role? This cannot be undone.',
  deleteConfirmYes: 'Delete',
  deleteConfirmNo: 'Cancel',

  // error surface (toast) for a blocked delete — the 409 "assigned to N account(s)" message
  deleteBlockedSummary: 'Cannot delete role',
} as const;
