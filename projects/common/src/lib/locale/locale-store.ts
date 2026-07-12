import { Injectable, signal } from '@angular/core';
import { Locale, toSupportedLocale } from './locale';

/**
 * Holds the active UI locale as a signal, mirrored into `localStorage` so it persists across
 * reloads and tabs — unlike `AuthStore`'s token, a locale preference is not session-scoped, so
 * `localStorage` (not `sessionStorage`) is the store. The signal is the source of truth for change
 * detection; `localStorage` is read once at init and written manually in the setter (no `effect()`),
 * mirroring `AuthStore`'s manual sync style.
 */
@Injectable({ providedIn: 'root' })
export class LocaleStore {
  private static readonly STORAGE_KEY = 'nb-locale';

  private readonly localeSignal = signal<Locale>(
    toSupportedLocale(localStorage.getItem(LocaleStore.STORAGE_KEY)),
  );

  readonly locale = this.localeSignal.asReadonly();

  /** Switches the active locale, validating and persisting it. Invalid values fall back silently. */
  setLocale(locale: string): void {
    const resolved = toSupportedLocale(locale);
    this.localeSignal.set(resolved);
    localStorage.setItem(LocaleStore.STORAGE_KEY, resolved);
  }
}
