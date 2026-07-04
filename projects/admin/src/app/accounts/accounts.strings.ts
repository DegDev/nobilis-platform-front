/**
 * User-visible strings for the accounts screen, isolated in one place (same i18n seam rationale as
 * the settings/roles/login strings — no hardcoded display strings in the templates).
 */
export const ACCOUNTS_STRINGS = {
  title: 'Accounts',
  back: 'Back to dashboard',

  // table columns + cells
  columnId: 'ID',
  columnStatus: 'Status',
  columnRealms: 'Realms',
  columnRoles: 'Roles',
  columnIdentities: 'Identities',
  noRealms: 'None',
  noRoles: 'None',
  noIdentities: 'None',
  edit: 'Edit',

  // empty state (a fresh database has no accounts — the config admin signs in without an account row)
  emptyTitle: 'No accounts yet',
  emptyBody:
    'Accounts appear once identities and login are enabled (a later milestone). The configured ' +
    'admin signs in without an account row, so a fresh database lists none.',

  // dialog
  editHeader: 'Edit account',
  fieldStatus: 'Status',
  fieldRealms: 'Realms',
  fieldRoles: 'Roles',
  statusPlaceholder: 'Select status',
  realmsPlaceholder: 'Select realms',
  rolesPlaceholder: 'Select roles',
  identitiesLabel: 'Identities',
  identitiesReadonlyHint: 'Identities are managed elsewhere; shown here for reference only.',
  noIdentitiesInDialog: 'This account has no identities.',
  save: 'Save',
  cancel: 'Cancel',
} as const;
