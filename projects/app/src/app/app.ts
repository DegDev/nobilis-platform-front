import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Locale, LocaleStore } from 'common';

@Component({
  selector: 'nb-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly localeStore = inject(LocaleStore);

  readonly locale = this.localeStore.locale;

  // loadTranslations() doesn't retro-activate $localize strings already evaluated in the running
  // app, so a locale switch reloads the page rather than trying to be reactive.
  switchLocale(locale: Locale): void {
    this.localeStore.setLocale(locale);
    location.reload();
  }
}
