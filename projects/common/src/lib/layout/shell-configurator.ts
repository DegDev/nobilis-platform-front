import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { $t, updatePreset, updateSurfacePalette } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import Lara from '@primeuix/themes/lara';
import Nora from '@primeuix/themes/nora';
import { SelectButtonModule } from 'primeng/selectbutton';
import { LayoutService } from './layout-service';

const presets = { Aura, Lara, Nora } as const;

type PresetName = keyof typeof presets;

interface SurfaceSwatch {
  name?: string;
  palette?: Record<string, string>;
}

const SCALE_MIN = 12;
const SCALE_MAX = 20;

/**
 * Ported from primefaces/sakai-ng@21.0.0 src/app/layout/component/app.configurator.ts (MIT) —
 * component logic (preset/primary/surface switching) is a full functional port; the template is
 * re-styled from Tailwind utility classes to SCSS against `@primeuix/themes` tokens (no MIT SCSS
 * counterpart exists for this file — see docs/sources-log.md "M07 slice 2"). The `*ngIf` holdout
 * (`showMenuModeButton`, gated on `router.url.includes('auth')`) is dropped rather than migrated to
 * `@if`: in this app the shell only ever mounts inside the authenticated route subtree (slice 1),
 * so the condition is structurally always-true here — consistent with slice 1's precedent of
 * dropping inert upstream chrome rather than porting dead conditions for fidelity. `config`/
 * `primeng` (two unused `PrimeNG` injections in the upstream file) and the `Router` dependency they
 * existed for are dropped for the same reason. The scale control (below the Menu Mode section) has
 * no upstream counterpart at all — own addition, see docs/sources-log.md.
 */
@Component({
  selector: 'nb-shell-configurator',
  imports: [CommonModule, FormsModule, SelectButtonModule],
  template: `
    <div class="layout-config-panel">
      <div class="layout-config-panel-section">
        <span class="layout-config-panel-label">{{ primaryLabel }}</span>
        <div class="layout-config-panel-colors">
          @for (primaryColor of primaryColors(); track primaryColor.name) {
            <button
              type="button"
              [title]="primaryColor.name"
              (click)="updatePrimary($event, primaryColor)"
              class="layout-config-panel-color"
              [class.layout-config-panel-color-selected]="
                primaryColor.name === selectedPrimaryColor()
              "
              [style.background-color]="
                primaryColor.name === 'noir' ? 'var(--text-color)' : primaryColor.palette?.['500']
              "
            ></button>
          }
        </div>
      </div>

      <div class="layout-config-panel-section">
        <span class="layout-config-panel-label">{{ surfaceLabel }}</span>
        <div class="layout-config-panel-colors">
          @for (surface of surfaces; track surface.name) {
            <button
              type="button"
              [title]="surface.name"
              (click)="updateSurface($event, surface)"
              class="layout-config-panel-color"
              [class.layout-config-panel-color-selected]="isSurfaceSelected(surface.name)"
              [style.background-color]="surface.palette?.['500']"
            ></button>
          }
        </div>
      </div>

      <div class="layout-config-panel-section">
        <span class="layout-config-panel-label">{{ presetsLabel }}</span>
        <p-selectbutton
          [options]="presetOptions"
          [ngModel]="selectedPreset()"
          (ngModelChange)="onPresetChange($event)"
          [allowEmpty]="false"
          size="small"
        />
      </div>

      <div class="layout-config-panel-section">
        <span class="layout-config-panel-label">{{ menuModeLabel }}</span>
        <p-selectbutton
          [ngModel]="menuMode()"
          (ngModelChange)="onMenuModeChange($event)"
          [options]="menuModeOptions"
          [allowEmpty]="false"
          size="small"
        />
      </div>

      <div class="layout-config-panel-section">
        <span class="layout-config-panel-label">{{ scaleLabel }}</span>
        <div class="layout-config-panel-scale">
          <button
            type="button"
            class="layout-config-panel-scale-action"
            [disabled]="scale() <= scaleMin"
            (click)="decrementScale()"
          >
            <i class="pi pi-minus"></i>
          </button>
          <span class="layout-config-panel-scale-value">{{ scale() }}px</span>
          <button
            type="button"
            class="layout-config-panel-scale-action"
            [disabled]="scale() >= scaleMax"
            (click)="incrementScale()"
          >
            <i class="pi pi-plus"></i>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ShellConfigurator implements OnInit {
  private readonly layoutService = inject(LayoutService);

  protected readonly primaryLabel = $localize`:@@ShellConfiguratorPrimary:Primary`;
  protected readonly surfaceLabel = $localize`:@@ShellConfiguratorSurface:Surface`;
  protected readonly presetsLabel = $localize`:@@ShellConfiguratorPresets:Presets`;
  protected readonly menuModeLabel = $localize`:@@ShellConfiguratorMenuMode:Menu Mode`;
  protected readonly scaleLabel = $localize`:@@ShellConfiguratorScale:Scale`;

  protected readonly scaleMin = SCALE_MIN;
  protected readonly scaleMax = SCALE_MAX;

  protected readonly presetOptions = Object.keys(presets);

  protected readonly menuModeOptions = [
    { label: $localize`:@@ShellConfiguratorMenuModeStatic:Static`, value: 'static' },
    { label: $localize`:@@ShellConfiguratorMenuModeOverlay:Overlay`, value: 'overlay' },
  ];

  protected readonly surfaces: SurfaceSwatch[] = [
    {
      name: 'slate',
      palette: {
        0: '#ffffff',
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
        950: '#020617',
      },
    },
    {
      name: 'gray',
      palette: {
        0: '#ffffff',
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
        950: '#030712',
      },
    },
    {
      name: 'zinc',
      palette: {
        0: '#ffffff',
        50: '#fafafa',
        100: '#f4f4f5',
        200: '#e4e4e7',
        300: '#d4d4d8',
        400: '#a1a1aa',
        500: '#71717a',
        600: '#52525b',
        700: '#3f3f46',
        800: '#27272a',
        900: '#18181b',
        950: '#09090b',
      },
    },
    {
      name: 'neutral',
      palette: {
        0: '#ffffff',
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#e5e5e5',
        300: '#d4d4d4',
        400: '#a3a3a3',
        500: '#737373',
        600: '#525252',
        700: '#404040',
        800: '#262626',
        900: '#171717',
        950: '#0a0a0a',
      },
    },
    {
      name: 'stone',
      palette: {
        0: '#ffffff',
        50: '#fafaf9',
        100: '#f5f5f4',
        200: '#e7e5e4',
        300: '#d6d3d1',
        400: '#a8a29e',
        500: '#78716c',
        600: '#57534e',
        700: '#44403c',
        800: '#292524',
        900: '#1c1917',
        950: '#0c0a09',
      },
    },
    {
      name: 'soho',
      palette: {
        0: '#ffffff',
        50: '#ececec',
        100: '#dedfdf',
        200: '#c4c4c6',
        300: '#adaeb0',
        400: '#97979b',
        500: '#7f8084',
        600: '#6a6b70',
        700: '#55565b',
        800: '#3f4046',
        900: '#2c2c34',
        950: '#16161d',
      },
    },
    {
      name: 'viva',
      palette: {
        0: '#ffffff',
        50: '#f3f3f3',
        100: '#e7e7e8',
        200: '#cfd0d0',
        300: '#b7b8b9',
        400: '#9fa1a1',
        500: '#87898a',
        600: '#6e7173',
        700: '#565a5b',
        800: '#3e4244',
        900: '#262b2c',
        950: '#0e1315',
      },
    },
    {
      name: 'ocean',
      palette: {
        0: '#ffffff',
        50: '#fbfcfc',
        100: '#F7F9F8',
        200: '#EFF3F2',
        300: '#DADEDD',
        400: '#B1B7B6',
        500: '#828787',
        600: '#5F7274',
        700: '#415B61',
        800: '#29444E',
        900: '#183240',
        950: '#0c1920',
      },
    },
  ];

  protected readonly selectedPrimaryColor = computed(
    () => this.layoutService.layoutConfig().primary,
  );
  protected readonly selectedSurfaceColor = computed(
    () => this.layoutService.layoutConfig().surface,
  );
  protected readonly selectedPreset = computed(() => this.layoutService.layoutConfig().preset);
  protected readonly menuMode = computed(() => this.layoutService.layoutConfig().menuMode);
  protected readonly scale = computed(() => this.layoutService.layoutConfig().scale);

  protected readonly primaryColors = computed<SurfaceSwatch[]>(() => {
    const presetPalette = presets[this.layoutService.layoutConfig().preset as PresetName].primitive;
    const colors = [
      'emerald',
      'green',
      'lime',
      'orange',
      'amber',
      'yellow',
      'teal',
      'cyan',
      'sky',
      'blue',
      'indigo',
      'violet',
      'purple',
      'fuchsia',
      'pink',
      'rose',
    ];
    const palettes: SurfaceSwatch[] = [{ name: 'noir', palette: {} }];

    colors.forEach((color) => {
      palettes.push({
        name: color,
        palette: (presetPalette as Record<string, SurfaceSwatch['palette']>)?.[color],
      });
    });

    return palettes;
  });

  protected isSurfaceSelected(name: string | undefined): boolean {
    const selected = this.selectedSurfaceColor();
    if (selected) return selected === name;
    return this.layoutService.layoutConfig().darkTheme ? name === 'zinc' : name === 'slate';
  }

  protected updatePrimary(event: Event, color: SurfaceSwatch): void {
    this.layoutService.layoutConfig.update((state) => ({ ...state, primary: color.name ?? '' }));
    updatePreset(this.getPresetExt());
    event.stopPropagation();
  }

  protected updateSurface(event: Event, surface: SurfaceSwatch): void {
    this.layoutService.layoutConfig.update((state) => ({
      ...state,
      surface: surface.name ?? null,
    }));
    updateSurfacePalette(surface.palette);
    event.stopPropagation();
  }

  protected onPresetChange(preset: string): void {
    this.layoutService.layoutConfig.update((state) => ({ ...state, preset }));
    const surfacePalette = this.surfaces.find(
      (s) => s.name === this.selectedSurfaceColor(),
    )?.palette;
    $t()
      .preset(presets[preset as PresetName])
      .preset(this.getPresetExt())
      .surfacePalette(surfacePalette)
      .use({ useDefaultOptions: true });
  }

  protected onMenuModeChange(menuMode: 'static' | 'overlay'): void {
    this.layoutService.layoutConfig.update((state) => ({ ...state, menuMode }));
  }

  protected decrementScale(): void {
    this.layoutService.layoutConfig.update((state) => ({
      ...state,
      scale: Math.max(SCALE_MIN, state.scale - 1),
    }));
  }

  protected incrementScale(): void {
    this.layoutService.layoutConfig.update((state) => ({
      ...state,
      scale: Math.min(SCALE_MAX, state.scale + 1),
    }));
  }

  ngOnInit(): void {
    this.onPresetChange(this.layoutService.layoutConfig().preset);
  }

  private getPresetExt() {
    const color =
      this.primaryColors().find((c) => c.name === this.selectedPrimaryColor()) ??
      ({} as SurfaceSwatch);
    const preset = this.layoutService.layoutConfig().preset;

    if (color.name === 'noir') {
      return {
        semantic: {
          primary: {
            50: '{surface.50}',
            100: '{surface.100}',
            200: '{surface.200}',
            300: '{surface.300}',
            400: '{surface.400}',
            500: '{surface.500}',
            600: '{surface.600}',
            700: '{surface.700}',
            800: '{surface.800}',
            900: '{surface.900}',
            950: '{surface.950}',
          },
          colorScheme: {
            light: {
              primary: {
                color: '{primary.950}',
                contrastColor: '#ffffff',
                hoverColor: '{primary.800}',
                activeColor: '{primary.700}',
              },
              highlight: {
                background: '{primary.950}',
                focusBackground: '{primary.700}',
                color: '#ffffff',
                focusColor: '#ffffff',
              },
            },
            dark: {
              primary: {
                color: '{primary.50}',
                contrastColor: '{primary.950}',
                hoverColor: '{primary.200}',
                activeColor: '{primary.300}',
              },
              highlight: {
                background: '{primary.50}',
                focusBackground: '{primary.300}',
                color: '{primary.950}',
                focusColor: '{primary.950}',
              },
            },
          },
        },
      };
    }

    if (preset === 'Nora') {
      return {
        semantic: {
          primary: color.palette,
          colorScheme: {
            light: {
              primary: {
                color: '{primary.600}',
                contrastColor: '#ffffff',
                hoverColor: '{primary.700}',
                activeColor: '{primary.800}',
              },
              highlight: {
                background: '{primary.600}',
                focusBackground: '{primary.700}',
                color: '#ffffff',
                focusColor: '#ffffff',
              },
            },
            dark: {
              primary: {
                color: '{primary.500}',
                contrastColor: '{surface.900}',
                hoverColor: '{primary.400}',
                activeColor: '{primary.300}',
              },
              highlight: {
                background: '{primary.500}',
                focusBackground: '{primary.400}',
                color: '{surface.900}',
                focusColor: '{surface.900}',
              },
            },
          },
        },
      };
    }

    return {
      semantic: {
        primary: color.palette,
        colorScheme: {
          light: {
            primary: {
              color: '{primary.500}',
              contrastColor: '#ffffff',
              hoverColor: '{primary.600}',
              activeColor: '{primary.700}',
            },
            highlight: {
              background: '{primary.50}',
              focusBackground: '{primary.100}',
              color: '{primary.700}',
              focusColor: '{primary.800}',
            },
          },
          dark: {
            primary: {
              color: '{primary.400}',
              contrastColor: '{surface.900}',
              hoverColor: '{primary.300}',
              activeColor: '{primary.200}',
            },
            highlight: {
              background: 'color-mix(in srgb, {primary.400}, transparent 84%)',
              focusBackground: 'color-mix(in srgb, {primary.400}, transparent 76%)',
              color: 'rgba(255,255,255,.87)',
              focusColor: 'rgba(255,255,255,.87)',
            },
          },
        },
      },
    };
  }
}
