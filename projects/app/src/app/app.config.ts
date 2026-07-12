import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  LOCALE_ID,
  inject,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { LocaleStore, localeInterceptor } from 'common';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // registerLocaleData for en/ru/ro already ran in initI18n() before bootstrap; LOCALE_ID here
    // drives DatePipe/CurrencyPipe/ICU to match the active UI locale.
    { provide: LOCALE_ID, useFactory: () => inject(LocaleStore).locale() },
    provideHttpClient(withInterceptors([localeInterceptor])),
  ],
};
