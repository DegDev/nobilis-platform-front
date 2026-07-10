/**
 * User-visible strings for the integrations screen, isolated in one place (same i18n seam
 * rationale as the settings strings — no hardcoded display strings in the templates).
 */
export const INTEGRATIONS_STRINGS = {
  title: 'Integrations',
  back: 'Back to dashboard',

  statusSet: 'Key is set',
  statusNotSet: 'Key is not set',
  valueLabel: 'API key',
  valuePlaceholder: 'Enter a new key to replace the stored value',
  replaceHint: 'The stored value is never shown. Entering a value replaces it.',
  save: 'Save',
  saved: 'Saved',

  addProviderTitle: 'Add a provider',
  providerLabel: 'Provider',
  providerPlaceholder: 'e.g. figma',
  providerRequired: 'Provider is required',
  valueRequired: 'API key is required',
  add: 'Add',
} as const;
