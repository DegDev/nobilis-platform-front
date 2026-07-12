/**
 * User-visible strings for the integrations screen, isolated in one place (same i18n seam
 * rationale as the settings strings — no hardcoded display strings in the templates).
 */
export const INTEGRATIONS_STRINGS = {
  title: $localize`:@@Integrations:Integrations`,
  back: $localize`:@@BackToDashboard:Back to dashboard`,

  statusSet: $localize`:@@KeyIsSet:Key is set`,
  statusNotSet: $localize`:@@KeyIsNotSet:Key is not set`,
  valueLabel: $localize`:@@ApiKeyLabel:API key`,
  valuePlaceholder: $localize`:@@ReplaceKeyPlaceholder:Enter a new key to replace the stored value`,
  replaceHint: $localize`:@@ReplaceKeyHint:The stored value is never shown. Entering a value replaces it.`,
  save: $localize`:@@Save:Save`,
  saved: $localize`:@@Saved:Saved`,

  addProviderTitle: $localize`:@@AddProviderTitle:Add a provider`,
  providerLabel: $localize`:@@Provider:Provider`,
  providerPlaceholder: $localize`:@@ProviderPlaceholderExample:e.g. figma`,
  providerRequired: $localize`:@@ProviderRequired:Provider is required`,
  valueRequired: $localize`:@@ApiKeyRequired:API key is required`,
  add: $localize`:@@Add:Add`,
} as const;
