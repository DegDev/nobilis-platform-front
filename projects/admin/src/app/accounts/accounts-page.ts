import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ColumnCellDirective,
  CrudDialog,
  GenericTable,
  PageableQuery,
  TableAction,
  TableActionEvent,
  TableColumn,
} from 'common';
import { ButtonModule } from 'primeng/button';
import { DialogService } from 'primeng/dynamicdialog';
import { TagModule } from 'primeng/tag';
import { AccountModel, AccountStatus } from './account';
import { AccountDialogData, AccountFormDialog } from './account-form-dialog';
import { AccountsApi } from './accounts-api';
import { ACCOUNTS_STRINGS } from './accounts.strings';

/**
 * The accounts screen — the third UI on the common CRUD kit (after settings and roles). Lists
 * accounts in a {@link GenericTable} (server-side paged via {@link AccountsApi}) with status as a
 * badge and realms/roles/identities as chips; edits status/realms/roles through an
 * {@link AccountFormDialog}. This screen MANAGES existing accounts — there is no create and no
 * delete (a soft delete is choosing `BLOCKED` in the edit dialog). The configured admin signs in
 * without an account row, so a fresh database lists none — an empty-state is shown then.
 * Zoneless/OnPush; all strings from {@link ACCOUNTS_STRINGS}.
 */
@Component({
  selector: 'nb-accounts-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ButtonModule, TagModule, GenericTable, ColumnCellDirective],
  providers: [DialogService, CrudDialog],
  templateUrl: './accounts-page.html',
  styleUrl: './accounts-page.scss',
})
export class AccountsPage {
  private readonly api = inject(AccountsApi);
  private readonly dialog = inject(CrudDialog);

  protected readonly strings = ACCOUNTS_STRINGS;
  protected readonly rows = signal<AccountModel[]>([]);
  protected readonly totalRecords = signal(0);
  protected readonly loading = signal(false);
  // Distinguishes "not loaded yet" from "loaded, and there are zero accounts" so the empty-state
  // only shows after a real load resolved empty (never as an initial flash).
  protected readonly loaded = signal(false);

  protected readonly columns: TableColumn[] = [
    { field: 'id', header: ACCOUNTS_STRINGS.columnId, sortable: true },
    { field: 'status', header: ACCOUNTS_STRINGS.columnStatus, sortable: true },
    { field: 'realms', header: ACCOUNTS_STRINGS.columnRealms },
    { field: 'roles', header: ACCOUNTS_STRINGS.columnRoles },
    { field: 'identities', header: ACCOUNTS_STRINGS.columnIdentities },
  ];
  protected readonly actions: TableAction[] = [
    { id: 'edit', label: ACCOUNTS_STRINGS.edit, icon: 'pi pi-pencil' },
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
        this.loaded.set(true);
      },
      error: () => this.loading.set(false),
    });
  }

  protected onAction(event: TableActionEvent<AccountModel>): void {
    if (event.action === 'edit') {
      this.openForm(event.row);
    }
  }

  /** The badge severity for a lifecycle status: active = good, blocked = danger, pending = warn. */
  protected statusSeverity(status: AccountStatus): 'success' | 'danger' | 'warn' {
    return status === 'ACTIVE' ? 'success' : status === 'BLOCKED' ? 'danger' : 'warn';
  }

  private openForm(account: AccountModel): void {
    const data: AccountDialogData = { account };
    this.dialog
      .open<AccountModel | undefined>(AccountFormDialog, {
        header: this.strings.editHeader,
        modal: true,
        width: '34rem',
        data,
      })
      .subscribe((saved) => {
        if (saved) {
          this.load(this.lastQuery);
        }
      });
  }
}
