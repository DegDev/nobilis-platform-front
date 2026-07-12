/**
 * User-visible strings for the settings screen, isolated in one place (same i18n seam rationale as
 * the login/dashboard strings — no hardcoded display strings in the templates).
 */
export const SETTINGS_STRINGS = {
  title: $localize`:@@Settings:Settings`,
  back: $localize`:@@BackToDashboard:Back to dashboard`,
  newSetting: $localize`:@@NewSetting:New setting`,

  // table columns + cells
  columnKey: $localize`:@@Key:Key`,
  columnValue: $localize`:@@Value:Value`,
  columnSecret: $localize`:@@Secret:Secret`,
  secretBadge: $localize`:@@Secret:Secret`,
  secretMask: $localize`:@@Hidden:Hidden`,
  emptyValue: $localize`:@@EmptyValueDash:—`,
  edit: $localize`:@@Edit:Edit`,
  delete: $localize`:@@Delete:Delete`,

  // form fields
  fieldKey: $localize`:@@Key:Key`,
  fieldValue: $localize`:@@Value:Value`,
  fieldSecret: $localize`:@@StoreAsSecretLabel:Store as secret (encrypted)`,
  keyRequired: $localize`:@@KeyRequired:Key is required`,

  // dialog
  createHeader: $localize`:@@NewSetting:New setting`,
  editHeader: $localize`:@@EditSettingHeader:Edit setting`,
  save: $localize`:@@Save:Save`,
  cancel: $localize`:@@Cancel:Cancel`,
  secretEditHint: $localize`:@@SecretEditHint:This setting is stored as a secret; its value is hidden. Entering a value replaces the stored secret — saving with an empty value clears it.`,

  // delete confirmation
  deleteConfirmHeader: $localize`:@@DeleteSettingHeader:Delete setting`,
  deleteConfirmMessage: $localize`:@@DeleteSettingConfirmMessage:Delete this setting? This cannot be undone.`,
  deleteConfirmYes: $localize`:@@Delete:Delete`,
  deleteConfirmNo: $localize`:@@Cancel:Cancel`,
} as const;
