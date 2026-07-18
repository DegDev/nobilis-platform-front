import { Component } from '@angular/core';

/**
 * Ported from primefaces/sakai-ng@21.0.0 src/app/layout/component/app.footer.ts (MIT), with the
 * upstream Tailwind utility classes (`text-primary font-bold hover:underline`) replaced by
 * `.layout-footer-link` in shell.scss (see docs/sources-log.md) and the "SAKAI by" wording dropped
 * — this project owns the shell from here on, it doesn't ship as a Sakai-branded template.
 */
@Component({
  selector: 'nb-shell-footer',
  template: `<div class="layout-footer">
    {{ builtWith }}
    <a
      href="https://primeng.org"
      target="_blank"
      rel="noopener noreferrer"
      class="layout-footer-link"
      >PrimeNG</a
    >
  </div>`,
})
export class ShellFooter {
  protected readonly builtWith = $localize`:@@ShellFooterBuiltWith:Built with`;
}
