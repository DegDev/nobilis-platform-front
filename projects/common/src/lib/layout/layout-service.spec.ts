import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LayoutService, SHELL_SCALE_DEFAULT } from './layout-service';

describe('LayoutService', () => {
  let service: LayoutService;

  beforeEach(() => {
    service = TestBed.inject(LayoutService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to the shipped scale, static menu mode, and a light theme', () => {
    const config = service.layoutConfig();
    expect(config.scale).toBe(SHELL_SCALE_DEFAULT);
    expect(config.menuMode).toBe('static');
    expect(config.darkTheme).toBe(false);
  });

  it('onMenuToggle collapses the static desktop sidebar, not the mobile one', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1200);

    service.onMenuToggle();

    expect(service.layoutState().staticMenuDesktopInactive).toBe(true);
    expect(service.layoutState().mobileMenuActive).toBe(false);
  });

  it('onMenuToggle opens the mobile overlay on narrow viewports', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(600);

    service.onMenuToggle();

    expect(service.layoutState().mobileMenuActive).toBe(true);
    expect(service.layoutState().staticMenuDesktopInactive).toBe(false);
  });

  it('onMenuToggle toggles the overlay flag in overlay menu mode, regardless of viewport', () => {
    service.layoutConfig.update((config) => ({ ...config, menuMode: 'overlay' }));

    service.onMenuToggle();

    expect(service.layoutState().overlayMenuActive).toBe(true);
    expect(service.isOverlay()).toBe(true);
  });

  it('toggleDarkMode flips the darkTheme flag', () => {
    expect(service.isDarkTheme()).toBe(false);

    service.toggleDarkMode();
    expect(service.isDarkTheme()).toBe(true);

    service.toggleDarkMode();
    expect(service.isDarkTheme()).toBe(false);
  });

  it('toggleConfigSidebar flips visibility; hideConfigSidebar always closes it', () => {
    expect(service.layoutState().configSidebarVisible).toBe(false);

    service.toggleConfigSidebar();
    expect(service.layoutState().configSidebarVisible).toBe(true);

    service.hideConfigSidebar();
    expect(service.layoutState().configSidebarVisible).toBe(false);

    // Hiding an already-hidden sidebar is a no-op, not a toggle.
    service.hideConfigSidebar();
    expect(service.layoutState().configSidebarVisible).toBe(false);
  });

  it('setActivePath records the path and closes any open sidebar overlay', () => {
    service.layoutState.update((state) => ({ ...state, overlayMenuActive: true }));

    service.setActivePath('/settings');

    expect(service.layoutState().activePath).toBe('/settings');
    expect(service.layoutState().overlayMenuActive).toBe(false);
  });
});
