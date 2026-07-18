import { Component, computed, effect, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuItem } from 'primeng/api';
import { RouterModule } from '@angular/router';
import { ShellTopbar } from './shell-topbar';
import { ShellSidebar } from './shell-sidebar';
import { ShellFooter } from './shell-footer';
import { LayoutService } from './layout-service';

/**
 * Ported from primefaces/sakai-ng@21.0.0 src/app/layout/component/app.layout.ts (MIT). Mount as a
 * route-level wrapper component (matches upstream's `app.routes.ts` pattern: `{ path: '', component:
 * AppLayout, children: [...] }`), passing the consumer's own nav model via `[menu]` and projecting
 * any topbar actions (e.g. a sign-out button) through to `ShellTopbar`.
 */
@Component({
  selector: 'nb-shell',
  imports: [CommonModule, ShellTopbar, ShellSidebar, RouterModule, ShellFooter],
  template: `<div class="layout-wrapper" [ngClass]="containerClass()">
    <nb-shell-topbar><ng-content></ng-content></nb-shell-topbar>
    <nb-shell-sidebar [menu]="menu()"></nb-shell-sidebar>
    <div class="layout-main-container">
      <div class="layout-main">
        <router-outlet></router-outlet>
      </div>
      <nb-shell-footer></nb-shell-footer>
    </div>
    <div class="layout-mask"></div>
  </div>`,
})
export class Shell {
  private readonly layoutService = inject(LayoutService);

  readonly menu = input<MenuItem[]>([]);

  constructor() {
    effect(() => {
      const state = this.layoutService.layoutState();
      document.body.classList.toggle('blocked-scroll', state.mobileMenuActive);
    });
  }

  protected readonly containerClass = computed(() => {
    const config = this.layoutService.layoutConfig();
    const state = this.layoutService.layoutState();
    return {
      'layout-overlay': config.menuMode === 'overlay',
      'layout-static': config.menuMode === 'static',
      'layout-static-inactive': state.staticMenuDesktopInactive && config.menuMode === 'static',
      'layout-overlay-active': state.overlayMenuActive,
      'layout-mobile-active': state.mobileMenuActive,
    };
  });
}
