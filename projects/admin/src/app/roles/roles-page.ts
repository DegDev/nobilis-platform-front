import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ColumnCellDirective,
  CrudDialog,
  GenericTable,
  PageableQuery,
  ProblemDetailError,
  TableAction,
  TableActionEvent,
  TableColumn,
} from 'common';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService } from 'primeng/dynamicdialog';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { RoleModel } from './role';
import { RoleDialogData, RoleFormDialog } from './role-form-dialog';
import { RolesApi } from './roles-api';
import { ROLES_STRINGS } from './roles.strings';

/**
 * The roles screen — the second UI on the common CRUD kit (after settings). Lists roles in a
 * {@link GenericTable} (server-side paged via {@link RolesApi}), showing each role's permissions as
 * chips; creates/edits through a {@link RoleFormDialog} opened by {@link CrudDialog}; deletes behind
 * a PrimeNG confirmation. A blocked delete (the role is still assigned to accounts — the backend
 * answers {@code 409}) surfaces its problem message as a toast rather than failing silently.
 * Zoneless/OnPush; all strings from {@link ROLES_STRINGS}.
 */
@Component({
  selector: 'nb-roles-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ButtonModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    GenericTable,
    ColumnCellDirective,
  ],
  providers: [DialogService, CrudDialog, ConfirmationService, MessageService],
  templateUrl: './roles-page.html',
  styleUrl: './roles-page.scss',
})
export class RolesPage {
  private readonly api = inject(RolesApi);
  private readonly dialog = inject(CrudDialog);
  private readonly confirmation = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  protected readonly strings = ROLES_STRINGS;
  protected readonly rows = signal<RoleModel[]>([]);
  protected readonly totalRecords = signal(0);
  protected readonly loading = signal(false);

  protected readonly columns: TableColumn[] = [
    { field: 'code', header: ROLES_STRINGS.columnCode, sortable: true },
    { field: 'name', header: ROLES_STRINGS.columnName, sortable: true },
    { field: 'permissions', header: ROLES_STRINGS.columnPermissions },
  ];
  protected readonly actions: TableAction[] = [
    { id: 'edit', label: ROLES_STRINGS.edit, icon: 'pi pi-pencil' },
    { id: 'delete', label: ROLES_STRINGS.delete, icon: 'pi pi-trash', severity: 'danger' },
  ];

  // The table drives paging via lazy load; remember the last query so a write can reload the page.
  private lastQuery: PageableQuery = { page: 0, size: 10, sort: [] };

  /** Loads a page in response to the table's lazy-load event (also fired once on init). */
  protected load(query: PageableQuery): void {
    this.lastQuery = query;
    this.loading.set(true);
    this.api.list(query).subscribe({
      next: (page) => {
        this.rows.set([...page.content]);
        this.totalRecords.set(page.page.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected create(): void {
    this.openForm(null);
  }

  protected onAction(event: TableActionEvent<RoleModel>): void {
    if (event.action === 'edit') {
      this.openForm(event.row);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  private openForm(role: RoleModel | null): void {
    const data: RoleDialogData = { role };
    this.dialog
      .open<RoleModel | undefined>(RoleFormDialog, {
        header: role ? this.strings.editHeader : this.strings.createHeader,
        modal: true,
        width: '32rem',
        data,
      })
      .subscribe((saved) => {
        if (saved) {
          this.load(this.lastQuery);
        }
      });
  }

  private confirmDelete(role: RoleModel): void {
    this.confirmation.confirm({
      header: this.strings.deleteConfirmHeader,
      message: this.strings.deleteConfirmMessage,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { label: this.strings.deleteConfirmYes, severity: 'danger' },
      rejectButtonProps: { label: this.strings.deleteConfirmNo, severity: 'secondary' },
      accept: () => {
        this.api.delete(role.id).subscribe({
          next: () => this.load(this.lastQuery),
          error: (error: unknown) => {
            // A role still assigned to accounts is refused with a 409 — show its detail, not a
            // silent no-op. Non-problem errors fall through (already logged by the interceptor).
            if (error instanceof ProblemDetailError) {
              this.messages.add({
                severity: 'error',
                summary: this.strings.deleteBlockedSummary,
                detail: error.problem.detail ?? error.message,
              });
            }
          },
        });
      },
    });
  }
}
