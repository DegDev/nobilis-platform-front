/**
 * User-visible strings for the roles screen, isolated in one place (same i18n seam rationale as the
 * settings/login strings — no hardcoded display strings in the templates).
 */
export const ROLES_STRINGS = {
  title: $localize`:@@Roles:Roles`,
  back: $localize`:@@BackToDashboard:Back to dashboard`,
  newRole: $localize`:@@NewRole:New role`,

  // table columns + cells
  columnCode: $localize`:@@Code:Code`,
  columnName: $localize`:@@Name:Name`,
  columnPermissions: $localize`:@@Permissions:Permissions`,
  noPermissions: $localize`:@@None:None`,
  edit: $localize`:@@Edit:Edit`,
  delete: $localize`:@@Delete:Delete`,

  // form fields
  fieldCode: $localize`:@@Code:Code`,
  fieldName: $localize`:@@Name:Name`,
  fieldPermissions: $localize`:@@Permissions:Permissions`,
  codeRequired: $localize`:@@CodeRequired:Code is required`,
  nameRequired: $localize`:@@NameRequired:Name is required`,
  permissionsPlaceholder: $localize`:@@SelectPermissionsPlaceholder:Select permissions`,
  codeImmutableHint: $localize`:@@CodeImmutableHint:The code is the role’s immutable key and cannot be changed.`,

  // dialog
  createHeader: $localize`:@@NewRole:New role`,
  editHeader: $localize`:@@EditRoleHeader:Edit role`,
  save: $localize`:@@Save:Save`,
  cancel: $localize`:@@Cancel:Cancel`,

  // delete confirmation
  deleteConfirmHeader: $localize`:@@DeleteRoleHeader:Delete role`,
  deleteConfirmMessage: $localize`:@@DeleteRoleConfirmMessage:Delete this role? This cannot be undone.`,
  deleteConfirmYes: $localize`:@@Delete:Delete`,
  deleteConfirmNo: $localize`:@@Cancel:Cancel`,

  // error surface (toast) for a blocked delete — the 409 "assigned to N account(s)" message
  deleteBlockedSummary: $localize`:@@CannotDeleteRoleSummary:Cannot delete role`,
} as const;
