/**
 * User-visible strings for the admin dashboard placeholder, isolated in one place (same i18n
 * seam rationale as the login strings).
 */
export const DASHBOARD_STRINGS = {
  title: $localize`:@@AdminDashboardTitle:Admin dashboard`,
  signedInAs: $localize`:@@SignedInAs:Signed in as`,
  settings: $localize`:@@Settings:Settings`,
  roles: $localize`:@@Roles:Roles`,
  accounts: $localize`:@@Accounts:Accounts`,
  contentBlocks: $localize`:@@ContentBlocks:Content blocks`,
  integrations: $localize`:@@Integrations:Integrations`,
  notifications: $localize`:@@Notifications:Notifications`,
  aiLlm: $localize`:@@AiLlmTitle:AI / LLM`,
  logout: $localize`:@@SignOut:Sign out`,
} as const;
