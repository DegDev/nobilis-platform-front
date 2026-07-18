import { Injectable, computed, effect, signal } from '@angular/core';

export interface LayoutConfig {
  darkTheme: boolean;
  menuMode: 'static' | 'overlay';
}

interface LayoutState {
  staticMenuDesktopInactive: boolean;
  overlayMenuActive: boolean;
  mobileMenuActive: boolean;
  activePath: string | null;
}

/**
 * Ported from primefaces/sakai-ng@21.0.0 src/app/layout/service/layout.service.ts (MIT) —
 * trimmed to what the slice-1 structural shell uses (preset/primary/surface color state and the
 * config sidebar belong to the configurator, ported separately in slice 2).
 */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  readonly layoutConfig = signal<LayoutConfig>({
    darkTheme: false,
    menuMode: 'static',
  });

  readonly layoutState = signal<LayoutState>({
    staticMenuDesktopInactive: false,
    overlayMenuActive: false,
    mobileMenuActive: false,
    activePath: null,
  });

  readonly isSidebarActive = computed(
    () => this.layoutState().overlayMenuActive || this.layoutState().mobileMenuActive,
  );

  readonly isDarkTheme = computed(() => this.layoutConfig().darkTheme);

  readonly isOverlay = computed(() => this.layoutConfig().menuMode === 'overlay');

  private initialized = false;

  constructor() {
    effect(() => {
      const config = this.layoutConfig();

      if (!this.initialized) {
        this.initialized = true;
        return;
      }

      this.handleDarkModeTransition(config.darkTheme);
    });
  }

  private handleDarkModeTransition(darkTheme: boolean): void {
    if ('startViewTransition' in document) {
      document.startViewTransition(() => this.applyDarkMode(darkTheme));
    } else {
      this.applyDarkMode(darkTheme);
    }
  }

  private applyDarkMode(darkTheme: boolean): void {
    if (darkTheme) {
      document.documentElement.classList.add('app-dark');
    } else {
      document.documentElement.classList.remove('app-dark');
    }
  }

  toggleDarkMode(): void {
    this.layoutConfig.update((config) => ({ ...config, darkTheme: !config.darkTheme }));
  }

  onMenuToggle(): void {
    if (this.isOverlay()) {
      this.layoutState.update((state) => ({
        ...state,
        overlayMenuActive: !state.overlayMenuActive,
      }));
      return;
    }

    if (this.isDesktop()) {
      this.layoutState.update((state) => ({
        ...state,
        staticMenuDesktopInactive: !state.staticMenuDesktopInactive,
      }));
    } else {
      this.layoutState.update((state) => ({ ...state, mobileMenuActive: !state.mobileMenuActive }));
    }
  }

  setActivePath(path: string): void {
    this.layoutState.update((state) => ({
      ...state,
      activePath: path,
      overlayMenuActive: false,
      mobileMenuActive: false,
    }));
  }

  closeMobileOverlay(): void {
    this.layoutState.update((state) => ({
      ...state,
      overlayMenuActive: false,
      mobileMenuActive: false,
    }));
  }

  isDesktop(): boolean {
    return window.innerWidth > 991;
  }

  isMobile(): boolean {
    return !this.isDesktop();
  }
}
