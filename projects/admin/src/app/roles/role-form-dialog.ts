import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  FieldTemplateDirective,
  FormFieldState,
  GenericForm,
  ProblemDetailError,
  fieldErrorsByKey,
} from 'common';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { RoleModel } from './role';
import { RolesApi } from './roles-api';
import { ROLES_STRINGS } from './roles.strings';

/** What the opener passes as `config.data`: `null` seeds a create, a row seeds an edit. */
export interface RoleDialogData {
  readonly role: RoleModel | null;
}

/**
 * The create/edit host for a role: a {@link GenericForm} shown in a PrimeNG DynamicDialog (opened
 * via the common {@link CrudDialog}). `name` is a native `[formField]` input; the PERMISSIONS field
 * is the escape-hatch (`nbFieldTemplate`) — a PrimeNG `p-multiSelect` bound with plain
 * `[ngModel]`/`(ngModelChange)`, deliberately NOT `[formField]`. That routes around the unverified
 * Signal-Forms × PrimeNG CVA interop: the multiselect is a classic-forms (ngModel) control feeding a
 * signal, isolated from the form tree. Options come from the engine permission catalog fetched on
 * open.
 *
 * <p>`code` is the immutable business key: an editable, required field on create; shown DISABLED
 * above the form on edit and NEVER sent on the PUT. The dialog owns the write so it can stay open
 * and surface server errors — field-level (`fieldErrors` → per-field) and top-level (`409` duplicate
 * code / role-in-use, `400` unknown permission — which carry no `fieldErrors`, so their problem
 * `detail` shows as a form-level message).
 */
@Component({
  selector: 'nb-role-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    GenericForm,
    FieldTemplateDirective,
    MultiSelectModule,
    InputTextModule,
    MessageModule,
  ],
  templateUrl: './role-form-dialog.html',
})
export class RoleFormDialog {
  private readonly api = inject(RolesApi);
  private readonly ref = inject(DynamicDialogRef);
  private readonly config = inject<DynamicDialogConfig<RoleDialogData>>(DynamicDialogConfig);

  protected readonly strings = ROLES_STRINGS;

  private readonly existing = this.config.data?.role ?? null;
  protected readonly isEdit = this.existing !== null;
  protected readonly existingCode = this.existing?.code ?? '';

  /** The permission catalog — the multiselect options, fetched from the backend on open. */
  protected readonly catalog = signal<string[]>([]);
  /** The selected permissions — the escape-hatch value, bound to `p-multiSelect` via plain ngModel. */
  protected readonly permissions = signal<string[]>([...(this.existing?.permissions ?? [])]);

  protected readonly serverErrors = signal<Record<string, string>>({});
  protected readonly formError = signal<string | null>(null);
  protected readonly pending = signal(false);
  protected readonly fields = signal<FormFieldState[]>(this.seedFields());

  constructor() {
    this.api.getPermissionCatalog().subscribe((catalog) => this.catalog.set(catalog));
  }

  private seedFields(): FormFieldState[] {
    const nameField: FormFieldState = {
      key: 'name',
      label: this.strings.fieldName,
      type: 'text',
      required: true,
      requiredMessage: this.strings.nameRequired,
      value: this.existing?.name ?? '',
    };
    // A marker so GenericForm renders the `nbFieldTemplate` outlet in field order; its value is
    // unused — the p-multiSelect binds to the `permissions` signal, not this field.
    const permissionsField: FormFieldState = {
      key: 'permissions',
      label: this.strings.fieldPermissions,
      type: 'text',
      required: false,
      value: null,
    };
    // On edit `code` is immutable: shown disabled above the form, absent from the fields (so the PUT
    // never carries it). On create it is an editable, required field.
    if (this.isEdit) {
      return [nameField, permissionsField];
    }
    const codeField: FormFieldState = {
      key: 'code',
      label: this.strings.fieldCode,
      type: 'text',
      required: true,
      requiredMessage: this.strings.codeRequired,
      value: '',
    };
    return [codeField, nameField, permissionsField];
  }

  protected onSave(fields: FormFieldState[]): void {
    const byKey = new Map(fields.map((field) => [field.key, field.value]));
    const name = String(byKey.get('name') ?? '');
    const permissions = [...this.permissions()];

    this.pending.set(true);
    this.serverErrors.set({});
    this.formError.set(null);

    const request$ = this.isEdit
      ? this.api.update(this.existing!.id, { name, permissions })
      : this.api.create({ code: String(byKey.get('code') ?? ''), name, permissions });

    request$.subscribe({
      next: (saved) => this.ref.close(saved),
      error: (error: unknown) => {
        this.pending.set(false);
        if (error instanceof ProblemDetailError) {
          const byField = fieldErrorsByKey(error.problem);
          this.serverErrors.set(byField);
          // 409 (duplicate code / in use) and the unknown-permission 400 carry no fieldErrors —
          // surface the problem detail as a form-level message so the reason is not lost.
          if (Object.keys(byField).length === 0) {
            this.formError.set(error.problem.detail ?? error.message);
          }
        }
      },
    });
  }

  protected onCancel(): void {
    this.ref.close();
  }
}
