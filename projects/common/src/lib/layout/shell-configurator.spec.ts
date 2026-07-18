import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { LayoutService } from './layout-service';
import { ShellConfigurator } from './shell-configurator';

describe('ShellConfigurator', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ShellConfigurator] }).compileComponents();
  });

  it('clicking a primary swatch updates LayoutService.layoutConfig().primary', () => {
    const fixture = TestBed.createComponent(ShellConfigurator);
    fixture.detectChanges();
    const layoutService = TestBed.inject(LayoutService);
    const el = fixture.nativeElement as HTMLElement;

    const blueSwatch = el.querySelector<HTMLButtonElement>(
      '.layout-config-panel-color[title="blue"]',
    );
    expect(blueSwatch).toBeTruthy();
    blueSwatch!.click();
    fixture.detectChanges();

    expect(layoutService.layoutConfig().primary).toBe('blue');
  });

  it('clicking a surface swatch updates LayoutService.layoutConfig().surface', () => {
    const fixture = TestBed.createComponent(ShellConfigurator);
    fixture.detectChanges();
    const layoutService = TestBed.inject(LayoutService);
    const el = fixture.nativeElement as HTMLElement;

    const grayswatch = el.querySelector<HTMLButtonElement>(
      '.layout-config-panel-color[title="gray"]',
    );
    expect(grayswatch).toBeTruthy();
    grayswatch!.click();
    fixture.detectChanges();

    expect(layoutService.layoutConfig().surface).toBe('gray');
  });

  it('the scale stepper defaults to 16px and clamps at 12/20', () => {
    const fixture = TestBed.createComponent(ShellConfigurator);
    fixture.detectChanges();
    const layoutService = TestBed.inject(LayoutService);
    const el = fixture.nativeElement as HTMLElement;

    const [decrement, increment] = Array.from(
      el.querySelectorAll<HTMLButtonElement>('.layout-config-panel-scale-action'),
    );
    expect(el.querySelector('.layout-config-panel-scale-value')?.textContent?.trim()).toBe('16px');

    for (let i = 0; i < 10; i++) {
      decrement.click();
    }
    fixture.detectChanges();
    expect(layoutService.layoutConfig().scale).toBe(12);

    for (let i = 0; i < 20; i++) {
      increment.click();
    }
    fixture.detectChanges();
    expect(layoutService.layoutConfig().scale).toBe(20);
  });

  it('onPresetChange updates LayoutService.layoutConfig().preset', () => {
    const fixture = TestBed.createComponent(ShellConfigurator);
    fixture.detectChanges();
    const layoutService = TestBed.inject(LayoutService);

    (
      fixture.componentInstance as unknown as { onPresetChange(preset: string): void }
    ).onPresetChange('Lara');

    expect(layoutService.layoutConfig().preset).toBe('Lara');
  });
});
