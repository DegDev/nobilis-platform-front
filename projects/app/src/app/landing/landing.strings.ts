/**
 * User-visible strings for the portal landing placeholder, isolated in one place (same i18n seam
 * rationale as the admin screens' strings files).
 */
export const LANDING_STRINGS = {
  title: $localize`:@@NobilisPlatformTitle:Nobilis platform`,
  tagline: $localize`:@@NobilisPlatformTagline:A universal open-source web engine.`,
  placeholderNotice: $localize`:@@LandingPlaceholderNotice:This landing page is a placeholder. Real content arrives with the CMS.`,
} as const;
