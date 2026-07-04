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
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService } from 'primeng/dynamicdialog';
import { TagModule } from 'primeng/tag';
import { Setting } from './setting';
import { SettingDialogData, SettingFormDialog } from './setting-form-dialog';
import { SettingsApi } from './settings-api';
import { SETTINGS_STRINGS } from './settings.strings';

/**
 * The settings screen — the first UI built on the common CRUD kit. Lists settings in a
 * {@link GenericTable} (server-side paged via {@link SettingsApi}), masking secret values with a
 * lock tag (never a decrypted-looking placeholder); creates/edits through a {@link SettingFormDialog}
 * opened by {@link CrudDialog}; deletes behind a PrimeNG confirmation. Reuses the shared components
 * rather than hand-rolling a table/form. Zoneless/OnPush; all strings from {@link SETTINGS_STRINGS}.
 */
@Component({
  selector: 'nb-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ButtonModule,
    TagModule,
    ConfirmDialogModule,
    GenericTable,
    ColumnCellDirective,
  ],
  providers: [DialogService, CrudDialog, ConfirmationService],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage {
  private readonly api = inject(SettingsApi);
  private readonly dialog = inject(CrudDialog);
  private readonly confirmation = inject(ConfirmationService);

  protected readonly strings = SETTINGS_STRINGS;
  protected readonly rows = signal<Setting[]>([]);
  protected readonly totalRecords = signal(0);
  protected readonly loading = signal(false);

  protected readonly columns: TableColumn[] = [
    { field: 'key', header: SETTINGS_STRINGS.columnKey, sortable: true },
    { field: 'value', header: SETTINGS_STRINGS.columnValue },
    { field: 'secret', header: SETTINGS_STRINGS.columnSecret },
  ];
  protected readonly actions: TableAction[] = [
    { id: 'edit', label: SETTINGS_STRINGS.edit, icon: 'pi pi-pencil' },
    { id: 'delete', label: SETTINGS_STRINGS.delete, icon: 'pi pi-trash', severity: 'danger' },
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

  protected onAction(event: TableActionEvent<Setting>): void {
    if (event.action === 'edit') {
      this.openForm(event.row);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  private openForm(setting: Setting | null): void {
    const data: SettingDialogData = { setting };
    this.dialog
      .open<Setting | undefined>(SettingFormDialog, {
        header: setting ? this.strings.editHeader : this.strings.createHeader,
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

  private confirmDelete(setting: Setting): void {
    this.confirmation.confirm({
      header: this.strings.deleteConfirmHeader,
      message: this.strings.deleteConfirmMessage,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { label: this.strings.deleteConfirmYes, severity: 'danger' },
      rejectButtonProps: { label: this.strings.deleteConfirmNo, severity: 'secondary' },
      accept: () => {
        this.api.delete(setting.key).subscribe(() => this.load(this.lastQuery));
      },
    });
  }
}
