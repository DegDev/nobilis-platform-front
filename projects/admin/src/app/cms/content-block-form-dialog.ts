import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormFieldState, GenericForm, ProblemDetailError, fieldErrorsByKey } from 'common';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ContentBlock, ContentBlockStatus } from './content-block';
import { ContentBlocksApi } from './content-blocks-api';
import { CONTENT_BLOCKS_STRINGS } from './content-blocks.strings';

/** What the opener passes as `config.data`: `null` seeds a create, a row seeds an edit. */
export interface ContentBlockDialogData {
  readonly block: ContentBlock | null;
}

/**
 * The create/edit host for a content block's `key` + `status` — a {@link GenericForm} shown in a
 * PrimeNG DynamicDialog (opened via the common {@link CrudDialog}), same shape as
 * `SettingFormDialog`. Translations are a separate concern edited via
 * `ContentBlockTranslationsDialog` (a block must exist before its translations can be written, and
 * the nested per-locale editor doesn't fit this flat field list).
 */
@Component({
  selector: 'nb-content-block-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GenericForm],
  templateUrl: './content-block-form-dialog.html',
})
export class ContentBlockFormDialog {
  private readonly api = inject(ContentBlocksApi);
  private readonly ref = inject(DynamicDialogRef);
  private readonly config =
    inject<DynamicDialogConfig<ContentBlockDialogData>>(DynamicDialogConfig);

  protected readonly strings = CONTENT_BLOCKS_STRINGS;

  private readonly existing = this.config.data?.block ?? null;
  protected readonly isEdit = this.existing !== null;

  protected readonly serverErrors = signal<Record<string, string>>({});
  protected readonly pending = signal(false);
  protected readonly fields = signal<FormFieldState[]>(this.seedFields());

  private seedFields(): FormFieldState[] {
    const current = this.existing;
    const statusField: FormFieldState = {
      key: 'status',
      label: this.strings.fieldStatus,
      type: 'select',
      required: true,
      value: current?.status ?? 'DRAFT',
      options: [
        { label: this.strings.statusDraft, value: 'DRAFT' },
        { label: this.strings.statusPublished, value: 'PUBLISHED' },
      ],
    };
    if (this.isEdit) {
      return [statusField];
    }
    const keyField: FormFieldState = {
      key: 'key',
      label: this.strings.fieldKey,
      type: 'text',
      required: true,
      requiredMessage: this.strings.keyRequired,
      value: '',
    };
    return [keyField, statusField];
  }

  protected onSave(fields: FormFieldState[]): void {
    const byKey = new Map(fields.map((field) => [field.key, field.value]));
    const status = String(byKey.get('status') ?? 'DRAFT') as ContentBlockStatus;

    this.pending.set(true);
    this.serverErrors.set({});

    const request$ = this.isEdit
      ? this.api.updateStatus(this.existing!.key, { status })
      : this.api.create({ key: String(byKey.get('key') ?? ''), status });

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
