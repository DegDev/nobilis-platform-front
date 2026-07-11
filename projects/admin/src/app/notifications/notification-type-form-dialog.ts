import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { NotificationType } from './notification';
import { NotificationsApi } from './notifications-api';
import { NOTIFICATIONS_STRINGS } from './notifications.strings';

export interface NotificationTypeDialogData {
  readonly type: NotificationType | null;
}

/**
 * Create/edit dialog for a notification type. Create POSTs a new key+enabled+description; edit PUTs
 * enabled+description at an existing key. The key is immutable after creation.
 */
@Component({
  selector: 'nb-notification-type-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, TextareaModule, CheckboxModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <label for="key">{{ strings.fieldKey }}</label>
        <input pInputText id="key" formControlName="key" [readonly]="!creating" />
        @if (form.controls.key.touched && form.controls.key.invalid) {
          <small class="text-red-500">{{ strings.keyRequired }}</small>
        }
      </div>
      <div class="flex items-center gap-2">
        <p-checkbox formControlName="enabled" [binary]="true" inputId="enabled" />
        <label for="enabled">{{ strings.fieldEnabled }}</label>
      </div>
      <div class="flex flex-col gap-2">
        <label for="description">{{ strings.fieldDescription }}</label>
        <textarea pTextarea id="description" formControlName="description" rows="3"></textarea>
      </div>
      <div class="flex justify-end gap-2">
        <p-button
          type="button"
          [label]="strings.cancel"
          severity="secondary"
          (onClick)="ref.close()"
        />
        <p-button type="submit" [label]="strings.save" [disabled]="form.invalid" />
      </div>
    </form>
  `,
})
export class NotificationTypeFormDialog {
  private readonly api = inject(NotificationsApi);
  protected readonly ref = inject(DynamicDialogRef<NotificationType | undefined>);
  private readonly config = inject(DynamicDialogConfig<NotificationTypeDialogData>);
  protected readonly strings = NOTIFICATIONS_STRINGS;
  protected readonly creating: boolean;

  private readonly fb = inject(FormBuilder);
  protected readonly form = this.fb.nonNullable.group({
    key: ['', [Validators.required, Validators.maxLength(255)]],
    enabled: [true],
    description: ['' as string | null],
  });

  constructor() {
    const type = this.config.data?.type ?? null;
    this.creating = type === null;
    if (type) {
      this.form.patchValue({
        key: type.key,
        enabled: type.enabled,
        description: type.description,
      });
    }
  }

  protected save(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    if (this.creating) {
      this.api
        .createType({ key: v.key, enabled: v.enabled, description: v.description ?? null })
        .subscribe((t) => this.ref.close(t));
    } else {
      this.api
        .updateType(v.key, { enabled: v.enabled, description: v.description ?? null })
        .subscribe((t) => this.ref.close(t));
    }
  }
}
