import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { IntegrationProvider, keyFor, providerLabel, toProviders } from './integration';
import { IntegrationsApi } from './integrations-api';
import { INTEGRATIONS_STRINGS } from './integrations.strings';

/**
 * The Integrations screen: lists `integration.<provider>.api_key` settings grouped one card per
 * provider, and lets an operator add a new provider or replace an existing provider's key.
 *
 * <p>Bespoke card layout, not the flat `GenericTable`/`CrudDialog` CRUD kit — the screen's real
 * unit is a *provider* (grouped from N flat setting rows), which the flat kit doesn't model well
 * (see the plan's Architectural decisions §5). Still reuses `IntegrationsApi`'s HTTP conventions
 * and the same write-only/masked contract as the settings screen: a provider's stored key is never
 * rendered, only whether it is set.
 */
@Component({
  selector: 'nb-integrations-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    TagModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './integrations-page.html',
  styleUrl: './integrations-page.scss',
})
export class IntegrationsPage {
  private readonly api = inject(IntegrationsApi);
  private readonly messages = inject(MessageService);

  protected readonly strings = INTEGRATIONS_STRINGS;
  protected readonly loading = signal(false);
  protected readonly providers = signal<IntegrationProvider[]>([]);

  // Write-only inputs: pending values are never seeded from a stored value, only from user typing.
  protected readonly editValues = signal<Record<string, string>>({});
  protected readonly saving = signal<Record<string, boolean>>({});

  protected readonly newProvider = signal('');
  protected readonly newValue = signal('');
  protected readonly addPending = signal(false);

  constructor() {
    this.load();
  }

  protected providerLabel = providerLabel;

  protected load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (page) => {
        this.providers.set(toProviders(page.content));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected editValue(provider: string): string {
    return this.editValues()[provider] ?? '';
  }

  protected setEditValue(provider: string, value: string): void {
    this.editValues.update((values) => ({ ...values, [provider]: value }));
  }

  protected save(entry: IntegrationProvider): void {
    const value = this.editValue(entry.provider);
    if (!value) {
      return;
    }
    this.saving.update((state) => ({ ...state, [entry.provider]: true }));
    this.api.set(entry.key, value).subscribe({
      next: () => {
        this.saving.update((state) => ({ ...state, [entry.provider]: false }));
        this.setEditValue(entry.provider, '');
        this.messages.add({ severity: 'success', summary: this.strings.saved });
        this.load();
      },
      error: () => this.saving.update((state) => ({ ...state, [entry.provider]: false })),
    });
  }

  protected addProvider(): void {
    const provider = this.newProvider().trim();
    const value = this.newValue();
    if (!provider || !value || this.addPending()) {
      return;
    }
    this.addPending.set(true);
    this.api.set(keyFor(provider), value).subscribe({
      next: () => {
        this.addPending.set(false);
        this.newProvider.set('');
        this.newValue.set('');
        this.messages.add({ severity: 'success', summary: this.strings.saved });
        this.load();
      },
      error: () => this.addPending.set(false),
    });
  }
}
