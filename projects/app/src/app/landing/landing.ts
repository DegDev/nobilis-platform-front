import { Component } from '@angular/core';
import { LANDING_STRINGS } from './landing.strings';

/**
 * The portal's landing page: static placeholder markup, no data call. The banners and blocks the
 * milestone describes are CMS-driven, and the CMS does not exist yet — so this renders fixed
 * content rather than consuming an endpoint whose contract would be guessed ahead of its source.
 * The host's `/api/health` probe is deliberately unrelated: it proves the backend is alive, not
 * that this page has content.
 */
@Component({
  selector: 'nb-landing',
  imports: [],
  templateUrl: './landing.html',
})
export class Landing {
  protected readonly strings = LANDING_STRINGS;
}
