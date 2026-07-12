/**
 * User-visible strings for the accounts screen, isolated in one place (same i18n seam rationale as
 * the settings/roles/login strings — no hardcoded display strings in the templates).
 */
export const ACCOUNTS_STRINGS = {
  title: $localize`:@@Accounts:Accounts`,
  back: $localize`:@@BackToDashboard:Back to dashboard`,

  // table columns + cells
  columnId: $localize`:@@ColumnId:ID`,
  columnStatus: $localize`:@@Status:Status`,
  columnRealms: $localize`:@@Realms:Realms`,
  columnRoles: $localize`:@@Roles:Roles`,
  columnIdentities: $localize`:@@Identities:Identities`,
  noRealms: $localize`:@@None:None`,
  noRoles: $localize`:@@None:None`,
  noIdentities: $localize`:@@None:None`,
  edit: $localize`:@@Edit:Edit`,

  // empty state (a fresh database has no accounts — the config admin signs in without an account row)
  emptyTitle: $localize`:@@NoAccountsYetTitle:No accounts yet`,
  emptyBody: $localize`:@@NoAccountsYetBody:Accounts appear once identities and login are enabled (a later milestone). The configured admin signs in without an account row, so a fresh database lists none.`,

  // dialog
  editHeader: $localize`:@@EditAccountHeader:Edit account`,
  fieldStatus: $localize`:@@Status:Status`,
  fieldRealms: $localize`:@@Realms:Realms`,
  fieldRoles: $localize`:@@Roles:Roles`,
  statusPlaceholder: $localize`:@@SelectStatusPlaceholder:Select status`,
  realmsPlaceholder: $localize`:@@SelectRealmsPlaceholder:Select realms`,
  rolesPlaceholder: $localize`:@@SelectRolesPlaceholder:Select roles`,
  identitiesLabel: $localize`:@@Identities:Identities`,
  identitiesReadonlyHint: $localize`:@@IdentitiesReadonlyHint:Identities are managed elsewhere; shown here for reference only.`,
  noIdentitiesInDialog: $localize`:@@AccountHasNoIdentities:This account has no identities.`,
  save: $localize`:@@Save:Save`,
  cancel: $localize`:@@Cancel:Cancel`,
} as const;
