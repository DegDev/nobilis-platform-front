import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SelectModule } from 'primeng/select';
import { NotificationTemplate, Transport } from './notification';
import { NotificationsApi } from './notifications-api';
import { NOTIFICATIONS_STRINGS } from './notifications.strings';

export interface NotificationTemplateDialogData {
  readonly existingTypes?: readonly string[];
}

/**
 * Create dialog for a notification template — picks a type key and transport. This dialog is
 * create-only (templates are immutable in their type+transport pair; deletion removes them).
 */
@Component({
  selector: 'nb-notification-template-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ButtonModule, SelectModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <label for="typeKey">{{ strings.fieldTypeKey }}</label>
        <input
          pInputText
          id="typeKey"
          formControlName="typeKey"
          class="w-full"
          [placeholder]="strings.fieldTypeKey"
        />
        @if (form.controls.typeKey.touched && form.controls.typeKey.invalid) {
          <small class="text-red-500">{{ strings.typeKeyRequired }}</small>
        }
      </div>
      <div class="flex flex-col gap-2">
        <label for="transport">{{ strings.fieldTransport }}</label>
        <p-select
          inputId="transport"
          formControlName="transport"
          [options]="transportOptions"
          optionLabel="label"
          optionValue="value"
          class="w-full"
        />
        @if (form.controls.transport.touched && form.controls.transport.invalid) {
          <small class="text-red-500">{{ strings.transportRequired }}</small>
        }
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
export class NotificationTemplateFormDialog {
  private readonly api = inject(NotificationsApi);
  protected readonly ref = inject(DynamicDialogRef<NotificationTemplate | undefined>);
  private readonly config = inject(DynamicDialogConfig<NotificationTemplateDialogData>);
  protected readonly strings = NOTIFICATIONS_STRINGS;

  private readonly fb = inject(FormBuilder);
  protected readonly form = this.fb.nonNullable.group({
    typeKey: ['', Validators.required],
    transport: ['' as Transport, Validators.required],
  });

  protected readonly transportOptions = [
    { label: NOTIFICATIONS_STRINGS.transportEmail, value: 'EMAIL' },
    { label: NOTIFICATIONS_STRINGS.transportTelegram, value: 'TELEGRAM' },
    { label: NOTIFICATIONS_STRINGS.transportSms, value: 'SMS' },
  ];

  protected save(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.api.createTemplate(v).subscribe((t) => this.ref.close(t));
  }
}
