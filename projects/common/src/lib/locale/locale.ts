/**
 * Supported UI locale codes, mirroring the backend `?locale=` contract
 * (`LocaleResolver.java` — `en`/`ru`/`ro`, `DEFAULT_LOCALE = en`).
 */
export type Locale = 'en' | 'ru' | 'ro';

/** Single source of truth for the engine default locale, mirroring the backend `DEFAULT_LOCALE`. */
export const DEFAULT_LOCALE: Locale = 'en';

const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'ru', 'ro'];

/** Type guard: is `value` one of the supported locale codes? */
export function isSupportedLocale(value: string | null | undefined): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}

/** Resolves a raw value to a supported locale, falling back to {@link DEFAULT_LOCALE} silently. */
export function toSupportedLocale(value: string | null | undefined): Locale {
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE;
}
