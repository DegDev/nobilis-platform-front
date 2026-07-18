/**
 * User-visible strings for the admin dashboard placeholder, isolated in one place (same i18n
 * seam rationale as the login strings). `title` also backs the sidebar's Dashboard menu label and
 * `logout` the shell topbar's sign-out button (admin-menu.ts / admin-shell.ts) — the sidebar
 * replaced this screen's own former nav/logout buttons, so their strings live here still.
 */
export const DASHBOARD_STRINGS = {
  title: $localize`:@@AdminDashboardTitle:Admin dashboard`,
  signedInAs: $localize`:@@SignedInAs:Signed in as`,
  logout: $localize`:@@SignOut:Sign out`,
} as const;
