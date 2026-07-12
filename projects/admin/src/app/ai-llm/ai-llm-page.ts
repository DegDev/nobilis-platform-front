import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FormFieldState, GenericForm, ProblemDetailError, fieldErrorsByKey } from 'common';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { AiProfileApi } from './ai-profile-api';
import { AiFieldDescriptor, AiHealthCheckResult, AiProfile, AiProvider } from './ai-profile.model';
import { AI_LLM_STRINGS } from './ai-llm.strings';

/** Builds one {@link FormFieldState} from a catalog field + its effective value, by `type`. */
function toFormField(field: AiFieldDescriptor, rawValue: string | null): FormFieldState {
  if (field.options.length > 0) {
    return {
      key: field.fieldKey,
      label: field.fieldKey,
      type: 'select',
      required: false,
      value: rawValue ?? '',
      options: field.options.map((option) => ({ label: option, value: option })),
    };
  }
  switch (field.type) {
    case 'NUMBER':
      return {
        key: field.fieldKey,
        label: field.fieldKey,
        type: 'number',
        required: false,
        value: rawValue !== null && rawValue !== '' ? Number(rawValue) : null,
      };
    case 'BOOLEAN':
      return {
        key: field.fieldKey,
        label: field.fieldKey,
        type: 'checkbox',
        required: false,
        value: rawValue === 'true',
      };
    default:
      return {
        key: field.fieldKey,
        label: field.fieldKey,
        type: 'text',
        required: false,
        value: rawValue ?? '',
      };
  }
}

/** Converts an edited {@link FormFieldState}'s value back to the string the backend param wants. */
function toParamString(field: FormFieldState): string {
  if (field.type === 'checkbox') {
    return field.value === true ? 'true' : 'false';
  }
  return field.value === null || field.value === undefined ? '' : String(field.value);
}

/**
 * The AI/LLM screen: a purpose/provider picker plus a form RENDERED FROM the backend's field
 * descriptor (see {@link AiProfileApi.descriptor}) — the data-driven core of milestone 06. A new
 * catalog field (backend-only change) appears here with zero frontend change, since every editable
 * INFRA/OPERATIONAL-shaped field is iterated generically via {@link GenericForm}.
 *
 * <p>Three field groups, rendered differently because they behave differently, not because of any
 * hardcoded field list: read-only INFRA fields (`editable=false`, e.g. `base-url`) as plain text;
 * SECRET fields as bespoke write-only password inputs showing only "configured"/"not configured"
 * (mirrors the Settings/Integrations screens — never a plaintext round-trip); every other editable
 * field through {@link GenericForm}.
 */
@Component({
  selector: 'nb-ai-llm-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    GenericForm,
    ButtonModule,
    InputTextModule,
    MessageModule,
    TagModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './ai-llm-page.html',
  styleUrl: './ai-llm-page.scss',
})
export class AiLlmPage {
  private readonly api = inject(AiProfileApi);
  private readonly messages = inject(MessageService);

  protected readonly strings = AI_LLM_STRINGS;
  protected readonly loading = signal(false);

  protected readonly purposes = signal<string[]>([]);
  protected readonly selectedPurpose = signal('');
  protected readonly providers = signal<AiProvider[]>([]);
  protected readonly selectedProvider = signal('');
  protected readonly profile = signal<AiProfile | null>(null);

  protected readonly readOnlyFields = signal<AiFieldDescriptor[]>([]);
  protected readonly secretDescriptors = signal<AiFieldDescriptor[]>([]);
  protected readonly secretValues = signal<Record<string, string>>({});
  protected readonly fields = signal<FormFieldState[]>([]);

  protected readonly serverErrors = signal<Record<string, string>>({});
  protected readonly formError = signal<string | null>(null);
  protected readonly pending = signal(false);

  protected readonly healthChecking = signal(false);
  protected readonly healthResult = signal<AiHealthCheckResult | null>(null);

  constructor() {
    this.loadPurposes();
  }

  private loadPurposes(): void {
    this.loading.set(true);
    this.api.purposes().subscribe({
      next: (purposes) => {
        this.purposes.set(purposes);
        const purpose = purposes[0];
        if (purpose) {
          this.selectPurpose(purpose);
        } else {
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  protected selectPurpose(purpose: string): void {
    this.selectedPurpose.set(purpose);
    this.healthResult.set(null);
    this.loading.set(true);
    this.api.providers(purpose).subscribe({
      next: (providers) => {
        this.providers.set(providers);
        this.api.profile(purpose).subscribe({
          next: (profile) => {
            this.profile.set(profile);
            const provider =
              providers.find((candidate) => candidate.code === profile.providerCode)?.code ??
              providers[0]?.code ??
              '';
            this.selectProvider(provider);
          },
          error: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
  }

  protected selectProvider(provider: string): void {
    this.selectedProvider.set(provider);
    if (!provider) {
      this.loading.set(false);
      return;
    }
    this.api.descriptor(this.selectedPurpose(), provider).subscribe({
      next: (descriptor) => {
        this.applyDescriptor(descriptor);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private applyDescriptor(descriptor: AiFieldDescriptor[]): void {
    const profile = this.profile();
    const currentForProvider = profile?.providerCode === this.selectedProvider() ? profile : null;
    const params = currentForProvider?.params ?? {};

    this.readOnlyFields.set(descriptor.filter((field) => !field.editable));

    const editable = descriptor.filter((field) => field.editable);
    this.secretDescriptors.set(editable.filter((field) => field.category === 'SECRET'));
    this.secretValues.set({});

    this.fields.set(
      editable
        .filter((field) => field.category !== 'SECRET')
        .map((field) => toFormField(field, params[field.fieldKey] ?? field.defaultValue)),
    );

    this.serverErrors.set({});
    this.formError.set(null);
  }

  protected secretValue(fieldKey: string): string {
    return this.secretValues()[fieldKey] ?? '';
  }

  protected setSecretValue(fieldKey: string, value: string): void {
    this.secretValues.update((values) => ({ ...values, [fieldKey]: value }));
  }

  protected isSecretConfigured(fieldKey: string): boolean {
    return this.profile()?.secretsSet[fieldKey] === true;
  }

  protected onSave(fields: FormFieldState[]): void {
    const params: Record<string, string> = {};
    for (const field of fields) {
      params[field.key] = toParamString(field);
    }
    const secrets: Record<string, string> = {};
    for (const [fieldKey, value] of Object.entries(this.secretValues())) {
      if (value) {
        secrets[fieldKey] = value;
      }
    }

    this.pending.set(true);
    this.serverErrors.set({});
    this.formError.set(null);

    this.api
      .save({
        purpose: this.selectedPurpose(),
        provider: this.selectedProvider(),
        params,
        secrets,
      })
      .subscribe({
        next: (profile) => {
          this.pending.set(false);
          this.profile.set(profile);
          this.messages.add({ severity: 'success', summary: this.strings.saved });
          this.selectProvider(this.selectedProvider());
        },
        error: (error: unknown) => {
          this.pending.set(false);
          if (error instanceof ProblemDetailError) {
            const byField = fieldErrorsByKey(error.problem);
            this.serverErrors.set(byField);
            if (Object.keys(byField).length === 0) {
              this.formError.set(error.problem.detail ?? error.message);
            }
          }
        },
      });
  }

  protected checkHealth(): void {
    this.healthChecking.set(true);
    this.healthResult.set(null);
    this.api.healthCheck(this.selectedPurpose()).subscribe({
      next: (result) => {
        this.healthChecking.set(false);
        this.healthResult.set(result);
      },
      error: () => this.healthChecking.set(false),
    });
  }
}
