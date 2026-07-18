/**
 * The one new user-visible string the admin sidebar menu needs — every item label reuses each
 * target screen's own already-translated title (see admin-menu.ts). Isolated here per the same
 * i18n seam convention as the other `*.strings.ts` files.
 */
export const ADMIN_MENU_STRINGS = {
  section: $localize`:@@AdminMenuSectionLabel:Menu`,
} as const;
