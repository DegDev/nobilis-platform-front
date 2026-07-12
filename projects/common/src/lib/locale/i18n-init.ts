import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en';
import localeRo from '@angular/common/locales/ro';
import localeRu from '@angular/common/locales/ru';
import { loadTranslations } from '@angular/localize';

import { DEFAULT_LOCALE } from './locale';
import { LocaleStore } from './locale-store';

/**
 * Runtime i18n bootstrap. Registers Angular locale data for every supported locale — DatePipe
 * throws NG0701 if `LOCALE_ID` ever diverges from a locale that was never registered, so all
 * three are registered unconditionally, not just the active one. Then loads the `$localize`
 * overlay dictionary for the active locale, unless it's the native default (`en`), which needs
 * no overlay. Must be awaited before `App`/`appConfig` are imported — importing them first would
 * evaluate `$localize`-tagged strings before the dictionary is loaded.
 */
export async function initI18n(): Promise<void> {
  registerLocaleData(localeEn, 'en');
  registerLocaleData(localeRu, 'ru');
  registerLocaleData(localeRo, 'ro');

  const locale = new LocaleStore().locale();
  if (locale === DEFAULT_LOCALE) {
    return;
  }

  try {
    const response = await fetch(`i18n/${locale}.json`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    loadTranslations(await response.json());
  } catch (err) {
    console.warn(`[i18n] failed to load "${locale}" dictionary, staying on ${DEFAULT_LOCALE}`, err);
  }
}
