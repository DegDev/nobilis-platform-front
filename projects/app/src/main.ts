/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { initI18n } from 'common';

(async () => {
  await initI18n();
  const { App } = await import('./app/app');
  const { appConfig } = await import('./app/app.config');
  await bootstrapApplication(App, appConfig);
})().catch((err) => console.error(err));
