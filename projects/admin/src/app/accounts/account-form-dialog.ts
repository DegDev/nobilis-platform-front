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
import { MessageModule } from 'primeng/message';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { AccountModel, AccountStatus, RoleRef } from './account';
import { AccountsApi } from './accounts-api';
import { ACCOUNTS_STRINGS } from './accounts.strings';

/** What the opener passes as `config.data`: the account row to edit. */
export interface AccountDialogData {
  readonly account: AccountModel;
}

const STATUS_OPTIONS: AccountStatus[] = ['ACTIVE', 'BLOCKED', 'PENDING'];
const REALM_OPTIONS: string[] = ['ADMIN', 'CLIENT'];

/**
 * The edit host for an account: a {@link GenericForm} in a PrimeNG DynamicDialog (via the common
 * {@link CrudDialog}). Every editable field is the escape-hatch (`nbFieldTemplate`), because the
 * kit's built-in inputs have no select control: **status** is a PrimeNG `p-select`, **realms** and
 * **roles** are `p-multiSelect`s — all three bound with plain `[ngModel]`/`(ngModelChange)` to
 * signals, deliberately NOT `[formField]` (the Signal-Forms × PrimeNG CVA interop stays quarantined,
 * per the roles pass). Realms are static enum options; role options are fetched from the roles API
 * and bound **by id** (the update contract). Identities are shown READ-ONLY — this screen does not
 * manage them — and the secret hash never crosses the wire.
 *
 * <p>There is no create/delete: a soft delete is choosing `BLOCKED`. The dialog owns the write so it
 * can stay open and surface a server error — an unknown realm or role id comes back `400` with a
 * top-level `detail` and no `fieldErrors`, shown as a form-level message.
 */
@Component({
  selector: 'nb-account-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    GenericForm,
    FieldTemplateDirective,
    SelectModule,
    MultiSelectModule,
    MessageModule,
  ],
  templateUrl: './account-form-dialog.html',
})
export class AccountFormDialog {
  private readonly api = inject(AccountsApi);
  private readonly ref = inject(DynamicDialogRef);
  private readonly config = inject<DynamicDialogConfig<AccountDialogData>>(DynamicDialogConfig);

  protected readonly strings = ACCOUNTS_STRINGS;
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly realmOptions = REALM_OPTIONS;

  private readonly account = this.config.data!.account;
  protected readonly identities = this.account.identities;

  // The three escape-hatch values, bound to p-select / p-multiSelect via plain ngModel (NOT
  // [formField]). Seeded from the account being edited.
  protected readonly status = signal<AccountStatus>(this.account.status);
  protected readonly realms = signal<string[]>([...this.account.realms]);
  protected readonly roleIds = signal<number[]>(this.account.roles.map((role) => role.id));

  /** Role options for the roles multiselect (id + code + name), fetched from the roles API on open. */
  protected readonly roleOptions = signal<RoleRef[]>([]);

  protected readonly serverErrors = signal<Record<string, string>>({});
  protected readonly formError = signal<string | null>(null);
  protected readonly pending = signal(false);
  protected readonly fields = signal<FormFieldState[]>(this.seedFields());

  constructor() {
    this.api.getRolesForOptions().subscribe((roles) => this.roleOptions.set(roles));
  }

  private seedFields(): FormFieldState[] {
    // Each field is an escape-hatch marker (status select + realms/roles multiselects). The kit's
    // built-in inputs have no select, so all three render via `nbFieldTemplate`; their values live
    // in the signals above, not in the field entries (value stays null and unused).
    const marker = (key: string, label: string): FormFieldState => ({
      key,
      label,
      type: 'text',
      required: false,
      value: null,
    });
    return [
      marker('status', this.strings.fieldStatus),
      marker('realms', this.strings.fieldRealms),
      marker('roles', this.strings.fieldRoles),
    ];
  }

  protected onSave(): void {
    this.pending.set(true);
    this.serverErrors.set({});
    this.formError.set(null);

    this.api
      .update(this.account.id, {
        status: this.status(),
        realms: [...this.realms()],
        roleIds: [...this.roleIds()],
      })
      .subscribe({
        next: (saved) => this.ref.close(saved),
        error: (error: unknown) => {
          this.pending.set(false);
          if (error instanceof ProblemDetailError) {
            const byField = fieldErrorsByKey(error.problem);
            this.serverErrors.set(byField);
            // Unknown realm / unknown role id → 400 with a top-level detail and no fieldErrors —
            // surface it as a form-level message so the reason is not lost.
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
