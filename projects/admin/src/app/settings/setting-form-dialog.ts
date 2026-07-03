import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormFieldState, GenericForm, ProblemDetailError, fieldErrorsByKey } from 'common';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageModule } from 'primeng/message';
import { Setting } from './setting';
import { SettingsApi } from './settings-api';
import { SETTINGS_STRINGS } from './settings.strings';

/** What the opener passes as `config.data`: `null` seeds a create, a row seeds an edit. */
export interface SettingDialogData {
  readonly setting: Setting | null;
}

/**
 * The create/edit host for a setting: a {@link GenericForm} shown in a PrimeNG DynamicDialog (opened
 * via the common {@link CrudDialog}). It owns the write so it can keep the form open and feed
 * server-side field errors back into it on a `400` (an RFC 9457 problem parsed to `fieldErrors`),
 * closing with the saved row only on success.
 *
 * <p>Typed model path (not the generic config array): the Setting shape is known — `key` (create
 * only; on edit it is the immutable path), `value`, and the `secret` flag. On edit the value field
 * starts EMPTY for a secret (its plaintext is never returned) — and per the backend's PUT semantics
 * submitting overwrites, so an empty submit clears the secret (see the inline hint).
 */
@Component({
  selector: 'nb-setting-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GenericForm, MessageModule],
  templateUrl: './setting-form-dialog.html',
})
export class SettingFormDialog {
  private readonly api = inject(SettingsApi);
  private readonly ref = inject(DynamicDialogRef);
  private readonly config = inject<DynamicDialogConfig<SettingDialogData>>(DynamicDialogConfig);

  protected readonly strings = SETTINGS_STRINGS;

  private readonly existing = this.config.data?.setting ?? null;
  protected readonly isEdit = this.existing !== null;
  protected readonly editingSecret = this.existing?.secret ?? false;

  protected readonly serverErrors = signal<Record<string, string>>({});
  protected readonly pending = signal(false);
  protected readonly fields = signal<FormFieldState[]>(this.seedFields());

  private seedFields(): FormFieldState[] {
    const current = this.existing;
    const valueField: FormFieldState = {
      key: 'value',
      label: this.strings.fieldValue,
      type: 'text',
      required: false,
      // Non-secret edits prefill the plaintext; secrets (and creates) start empty.
      value: current && !current.secret ? (current.value ?? '') : '',
    };
    const secretField: FormFieldState = {
      key: 'secret',
      label: this.strings.fieldSecret,
      type: 'checkbox',
      required: false,
      value: current?.secret ?? false,
    };
    if (this.isEdit) {
      return [valueField, secretField];
    }
    const keyField: FormFieldState = {
      key: 'key',
      label: this.strings.fieldKey,
      type: 'text',
      required: true,
      requiredMessage: this.strings.keyRequired,
      value: '',
    };
    return [keyField, valueField, secretField];
  }

  protected onSave(fields: FormFieldState[]): void {
    const byKey = new Map(fields.map((field) => [field.key, field.value]));
    const value = String(byKey.get('value') ?? '');
    const secret = byKey.get('secret') === true;

    this.pending.set(true);
    this.serverErrors.set({});

    const request$ = this.isEdit
      ? this.api.update(this.existing!.key, { value, secret })
      : this.api.create({ key: String(byKey.get('key') ?? ''), value, secret });

    request$.subscribe({
      next: (saved) => this.ref.close(saved),
      error: (error: unknown) => {
        this.pending.set(false);
        if (error instanceof ProblemDetailError) {
          this.serverErrors.set(fieldErrorsByKey(error.problem));
        }
      },
    });
  }

  protected onCancel(): void {
    this.ref.close();
  }
}
