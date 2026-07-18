import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { ShellMenuitem } from './shell-menuitem';

/**
 * Ported from primefaces/sakai-ng@21.0.0 src/app/layout/component/app.menu.ts (MIT). Upstream
 * hardcodes its demo `MenuItem[]` in `ngOnInit`; here the model is caller-supplied — the shell has
 * no opinion on what a consumer (admin, later app) navigates to.
 */
@Component({
  selector: 'nb-shell-menu',
  imports: [CommonModule, ShellMenuitem, RouterModule],
  template: `<ul class="layout-menu">
    @for (item of model(); track item.label) {
      @if (!item.separator) {
        <li nb-shell-menuitem [item]="item" [root]="true"></li>
      } @else {
        <li class="menu-separator"></li>
      }
    }
  </ul>`,
})
export class ShellMenu {
  readonly model = input<MenuItem[]>([]);
}
