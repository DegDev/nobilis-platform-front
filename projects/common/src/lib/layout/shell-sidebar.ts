import { Component, ElementRef, OnDestroy, OnInit, effect, inject, input } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';
import { ShellMenu } from './shell-menu';
import { LayoutService } from './layout-service';

/**
 * Ported from primefaces/sakai-ng@21.0.0 src/app/layout/component/app.sidebar.ts (MIT).
 */
@Component({
  selector: 'nb-shell-sidebar',
  imports: [ShellMenu, RouterModule],
  template: `
    <div class="layout-sidebar">
      <nb-shell-menu [model]="menu()"></nb-shell-menu>
    </div>
  `,
})
export class ShellSidebar implements OnInit, OnDestroy {
  private readonly layoutService = inject(LayoutService);
  private readonly router = inject(Router);
  private readonly el = inject(ElementRef);

  readonly menu = input<MenuItem[]>([]);

  private outsideClickListener: ((event: MouseEvent) => void) | null = null;
  private readonly destroy$ = new Subject<void>();

  constructor() {
    effect(() => {
      const state = this.layoutService.layoutState();
      const overlayOpen = this.layoutService.isDesktop()
        ? state.overlayMenuActive
        : state.mobileMenuActive;

      if (overlayOpen) {
        this.bindOutsideClickListener();
      } else {
        this.unbindOutsideClickListener();
      }
    });
  }

  ngOnInit(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe((event) =>
        this.layoutService.setActivePath((event as NavigationEnd).urlAfterRedirects),
      );

    this.layoutService.setActivePath(this.router.url);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.unbindOutsideClickListener();
  }

  private bindOutsideClickListener(): void {
    if (this.outsideClickListener) return;

    this.outsideClickListener = (event: MouseEvent) => {
      if (this.isOutsideClicked(event)) {
        this.layoutService.closeMobileOverlay();
      }
    };
    document.addEventListener('click', this.outsideClickListener);
  }

  private unbindOutsideClickListener(): void {
    if (!this.outsideClickListener) return;
    document.removeEventListener('click', this.outsideClickListener);
    this.outsideClickListener = null;
  }

  private isOutsideClicked(event: MouseEvent): boolean {
    const topbarButtonEl = document.querySelector('.layout-menu-button');
    const sidebarEl = this.el.nativeElement;
    const target = event.target as Node;

    return !(
      sidebarEl?.contains(target) ||
      topbarButtonEl?.contains(target) ||
      topbarButtonEl?.isSameNode(target)
    );
  }
}
