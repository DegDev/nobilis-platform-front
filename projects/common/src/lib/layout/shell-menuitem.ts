import { Component, OnInit, AfterViewInit, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { RippleModule } from 'primeng/ripple';
import { filter } from 'rxjs/operators';
import { LayoutService } from './layout-service';

/**
 * Ported from primefaces/sakai-ng@21.0.0 src/app/layout/component/app.menuitem.ts (MIT). The
 * `item` input is `MenuItem` (its own `[key: string]: any` index signature already covers the
 * custom `path`/`class`/`badgeClass` extras this file reads) rather than a dedicated nav-model
 * type — a typed nav-model contract replacing this + the raw `MenuItem[]` shape is slice 3
 * (nav-as-data, resolves BL-004), not this slice.
 */
@Component({
  // Deliberate attribute selector (recurses onto `<li nb-shell-menuitem>` below and in
  // shell-menu.ts, matching upstream's own attribute-based recursive menuitem pattern) —
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: '[nb-shell-menuitem]',
  imports: [CommonModule, RouterModule, RippleModule],
  template: `
    @if (root() && isVisible()) {
      <div class="layout-menuitem-root-text">{{ item()?.label }}</div>
    }
    @if ((!hasRouterLink() || hasChildren()) && isVisible()) {
      <a
        [attr.href]="item()?.url"
        (click)="itemClick($event)"
        [ngClass]="item()?.['class']"
        [attr.target]="item()?.target"
        tabindex="0"
        pRipple
      >
        <i [ngClass]="item()?.icon" class="layout-menuitem-icon"></i>
        <span class="layout-menuitem-text">{{ item()?.label }}</span>
        @if (hasChildren()) {
          <i class="pi pi-fw pi-angle-down layout-submenu-toggler"></i>
        }
      </a>
    }
    @if (hasRouterLink() && !hasChildren() && isVisible()) {
      <a
        (click)="itemClick($event)"
        [ngClass]="item()?.['class']"
        [routerLink]="item()?.routerLink"
        routerLinkActive="active-route"
        [routerLinkActiveOptions]="
          item()?.routerLinkActiveOptions || {
            paths: 'exact',
            queryParams: 'ignored',
            matrixParams: 'ignored',
            fragment: 'ignored',
          }
        "
        [attr.target]="item()?.target"
        tabindex="0"
        pRipple
      >
        <i [ngClass]="item()?.icon" class="layout-menuitem-icon"></i>
        <span class="layout-menuitem-text">{{ item()?.label }}</span>
        @if (hasChildren()) {
          <i class="pi pi-fw pi-angle-down layout-submenu-toggler"></i>
        }
      </a>
    }
    @if (hasChildren() && isVisible() && (root() || isActive())) {
      <ul
        [animate.enter]="initialized() ? 'p-submenu-enter' : null"
        [animate.leave]="'p-submenu-leave'"
        [class.layout-root-submenulist]="root()"
      >
        @for (child of item()?.items; track child?.label) {
          <li
            nb-shell-menuitem
            [item]="child"
            [parentPath]="fullPath()"
            [root]="false"
            [class]="child['badgeClass']"
          ></li>
        }
      </ul>
    }
  `,
  host: {
    '[class.active-menuitem]': 'isActive()',
    '[class.layout-root-menuitem]': 'root()',
  },
  styles: [
    `
      .p-submenu-enter {
        animation: p-animate-submenu-expand 450ms cubic-bezier(0.86, 0, 0.07, 1) forwards;
      }

      .p-submenu-leave {
        animation: p-animate-submenu-collapse 450ms cubic-bezier(0.86, 0, 0.07, 1) forwards;
      }

      @keyframes p-animate-submenu-expand {
        from {
          max-height: 0;
          overflow: hidden;
        }
        to {
          max-height: 1000px;
          overflow: visible;
        }
      }

      @keyframes p-animate-submenu-collapse {
        from {
          max-height: 1000px;
          overflow: hidden;
        }
        to {
          max-height: 0;
          overflow: hidden;
        }
      }
    `,
  ],
})
export class ShellMenuitem implements OnInit, AfterViewInit {
  private readonly layoutService = inject(LayoutService);
  private readonly router = inject(Router);

  readonly item = input<MenuItem | null>(null);
  readonly root = input<boolean>(false);
  readonly parentPath = input<string | null>(null);

  readonly isVisible = computed(() => this.item()?.visible !== false);
  readonly hasChildren = computed(() => !!this.item()?.items?.length);
  readonly hasRouterLink = computed(() => !!this.item()?.routerLink);

  readonly fullPath = computed(() => {
    const itemPath = this.item()?.['path'];
    if (!itemPath) return this.parentPath();
    const parent = this.parentPath();
    if (parent && !itemPath.startsWith(parent)) {
      return parent + itemPath;
    }
    return itemPath;
  });

  readonly isActive = computed(() => {
    const activePath = this.layoutService.layoutState().activePath;
    if (this.item()?.['path']) {
      return activePath?.startsWith(this.fullPath() ?? '') ?? false;
    }
    return false;
  });

  readonly initialized = signal<boolean>(false);

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      if (this.item()?.routerLink) {
        this.updateActiveStateFromRoute();
      }
    });
  }

  ngOnInit(): void {
    if (this.item()?.routerLink) {
      this.updateActiveStateFromRoute();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initialized.set(true));
  }

  private updateActiveStateFromRoute(): void {
    const item = this.item();
    if (!item?.routerLink) return;

    const isRouteActive = this.router.isActive(item.routerLink[0], {
      paths: 'exact',
      queryParams: 'ignored',
      matrixParams: 'ignored',
      fragment: 'ignored',
    });

    if (isRouteActive) {
      const parentPath = this.parentPath();
      if (parentPath) {
        this.layoutService.layoutState.update((state) => ({ ...state, activePath: parentPath }));
      }
    }
  }

  itemClick(event: Event): void {
    const item = this.item();

    if (item?.disabled) {
      event.preventDefault();
      return;
    }

    if (item?.command) {
      item.command({ originalEvent: event, item });
    }

    if (this.hasChildren()) {
      const activePath = this.isActive() ? this.parentPath() : this.fullPath();
      this.layoutService.layoutState.update((state) => ({ ...state, activePath }));
    } else {
      this.layoutService.closeMobileOverlay();
    }
  }
}
