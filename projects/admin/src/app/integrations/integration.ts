/** The subset of the settings wire shape this screen needs; mirrors `../settings/setting`'s `Setting`. */
export interface IntegrationSetting {
  readonly key: string;
  readonly value: string | null;
  readonly secret: boolean;
}

/** The key convention every integration secret follows: `integration.<provider>.api_key`. */
export const INTEGRATION_KEY_PREFIX = 'integration.';
const KEY_SUFFIX = '.api_key';

/** A frontend-only presentation nicety — no engine-level provider registry (see plan decision 3). */
const KNOWN_PROVIDER_LABELS: Record<string, string> = {
  figma: 'Figma',
};

/** Resolves a display label for a provider key segment, falling back to the raw segment. */
export function providerLabel(provider: string): string {
  return KNOWN_PROVIDER_LABELS[provider] ?? provider;
}

/** Builds the `Setting` key for a provider's secret. */
export function keyFor(provider: string): string {
  return `${INTEGRATION_KEY_PREFIX}${provider}${KEY_SUFFIX}`;
}

/** One provider's integration card — one secret per provider (this pass ships no multi-key). */
export interface IntegrationProvider {
  readonly provider: string;
  readonly key: string;
  readonly configured: boolean;
}

/**
 * Groups flat `integration.<provider>.api_key` rows into one provider entry each. Rows that don't
 * match the convention (unexpected shape) are skipped rather than rendered malformed.
 */
export function toProviders(settings: readonly IntegrationSetting[]): IntegrationProvider[] {
  const providers: IntegrationProvider[] = [];
  for (const setting of settings) {
    const provider = parseProvider(setting.key);
    if (provider) {
      providers.push({ provider, key: setting.key, configured: true });
    }
  }
  return providers;
}

function parseProvider(key: string): string | null {
  if (!key.startsWith(INTEGRATION_KEY_PREFIX) || !key.endsWith(KEY_SUFFIX)) {
    return null;
  }
  const provider = key.slice(INTEGRATION_KEY_PREFIX.length, key.length - KEY_SUFFIX.length);
  return provider.length > 0 ? provider : null;
}
