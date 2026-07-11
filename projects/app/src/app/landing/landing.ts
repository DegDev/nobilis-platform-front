import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { LANDING_STRINGS } from './landing.strings';
import { PortalContentApi } from './portal-content-api';

/** The CMS key for the landing hero block; the admin creates its content via the CMS screen. */
const HERO_KEY = 'landing.hero';

/**
 * The portal's landing page: fetches the hero content block from the CMS and renders it. If the
 * block isn't PUBLISHED yet (fresh install, nothing authored) the read resolves to `null` and the
 * page falls back to a static placeholder — it must never look broken just because the admin
 * hasn't published anything yet.
 */
@Component({
  selector: 'nb-landing',
  imports: [],
  templateUrl: './landing.html',
})
export class Landing {
  protected readonly strings = LANDING_STRINGS;

  private readonly contentApi = inject(PortalContentApi);
  protected readonly heroBody = toSignal(this.contentApi.read(HERO_KEY), { initialValue: null });
}
