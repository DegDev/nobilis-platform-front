import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  LOCALE_ID,
  inject,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { LocaleStore, localeInterceptor, problemDetailInterceptor } from 'common';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';

import { authInterceptor } from './auth/auth-interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // registerLocaleData for en/ru/ro already ran in initI18n() before bootstrap; LOCALE_ID here
    // drives DatePipe/CurrencyPipe/ICU to match the active UI locale.
    { provide: LOCALE_ID, useFactory: () => inject(LocaleStore).locale() },
    // authInterceptor stamps the Bearer token on /admin/api calls; problemDetailInterceptor turns
    // RFC 9457 error bodies into a typed ProblemDetailError the settings form reads field errors from;
    // localeInterceptor stamps the active UI locale as ?locale= on every request.
    provideHttpClient(
      withInterceptors([authInterceptor, problemDetailInterceptor, localeInterceptor]),
    ),
    provideAnimationsAsync(),
    providePrimeNG({ theme: { preset: Aura } }),
  ],
};
