import { Injectable, computed, effect, signal } from '@angular/core';

export interface LayoutConfig {
  darkTheme: boolean;
  menuMode: 'static' | 'overlay';
  preset: string;
  primary: string;
  surface: string | null;
  /** Root font-size in px. Own addition, not in upstream Sakai — see docs/sources-log.md. */
  scale: number;
}

interface LayoutState {
  staticMenuDesktopInactive: boolean;
  overlayMenuActive: boolean;
  mobileMenuActive: boolean;
  configSidebarVisible: boolean;
  activePath: string | null;
}

/** Shipped default root font-size (px) — 4K reality, overrides Sakai's 14px baseline. */
export const SHELL_SCALE_DEFAULT = 16;

/**
 * Ported from primefaces/sakai-ng@21.0.0 src/app/layout/service/layout.service.ts (MIT) — slice 1
 * trimmed preset/primary/surface/config-sidebar state out ("belongs to the configurator"); slice 2
 * adds it back, plus `scale` (own addition, see docs/sources-log.md).
 */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  readonly layoutConfig = signal<LayoutConfig>({
    darkTheme: false,
    menuMode: 'static',
    preset: 'Aura',
    primary: 'emerald',
    surface: null,
    scale: SHELL_SCALE_DEFAULT,
  });

  readonly layoutState = signal<LayoutState>({
    staticMenuDesktopInactive: false,
    overlayMenuActive: false,
    mobileMenuActive: false,
    configSidebarVisible: false,
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

    effect(() => {
      document.documentElement.style.fontSize = `${this.layoutConfig().scale}px`;
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

  toggleConfigSidebar(): void {
    this.layoutState.update((state) => ({
      ...state,
      configSidebarVisible: !state.configSidebarVisible,
    }));
  }

  hideConfigSidebar(): void {
    this.layoutState.update((state) => ({ ...state, configSidebarVisible: false }));
  }

  isDesktop(): boolean {
    return window.innerWidth > 991;
  }

  isMobile(): boolean {
    return !this.isDesktop();
  }
}
