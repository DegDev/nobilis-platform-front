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
import { CONTENT_LOCALES, ContentBlock } from './content-block';
import { ContentBlockDialogData, ContentBlockFormDialog } from './content-block-form-dialog';
import {
  ContentBlockTranslationsDialog,
  ContentBlockTranslationsDialogData,
} from './content-block-translations-dialog';
import { ContentBlocksApi } from './content-blocks-api';
import { CONTENT_BLOCKS_STRINGS } from './content-blocks.strings';

/**
 * The content-blocks screen — mirrors {@link SettingsPage} on the common CRUD kit: lists blocks in a
 * {@link GenericTable} (server-side paged via {@link ContentBlocksApi}), creates/edits `key`+`status`
 * through {@link ContentBlockFormDialog}, edits the `ru`/`ro` bodies through
 * {@link ContentBlockTranslationsDialog}, deletes behind a PrimeNG confirmation. Zoneless/OnPush; all
 * strings from {@link CONTENT_BLOCKS_STRINGS}.
 */
@Component({
  selector: 'nb-content-blocks-page',
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
  templateUrl: './content-blocks-page.html',
  styleUrl: './content-blocks-page.scss',
})
export class ContentBlocksPage {
  private readonly api = inject(ContentBlocksApi);
  private readonly dialog = inject(CrudDialog);
  private readonly confirmation = inject(ConfirmationService);

  protected readonly strings = CONTENT_BLOCKS_STRINGS;
  protected readonly rows = signal<ContentBlock[]>([]);
  protected readonly totalRecords = signal(0);
  protected readonly loading = signal(false);

  protected readonly columns: TableColumn[] = [
    { field: 'key', header: CONTENT_BLOCKS_STRINGS.columnKey, sortable: true },
    { field: 'status', header: CONTENT_BLOCKS_STRINGS.columnStatus },
    { field: 'translations', header: CONTENT_BLOCKS_STRINGS.columnTranslations },
  ];
  protected readonly actions: TableAction[] = [
    { id: 'edit', label: CONTENT_BLOCKS_STRINGS.edit, icon: 'pi pi-pencil' },
    { id: 'translate', label: CONTENT_BLOCKS_STRINGS.translate, icon: 'pi pi-language' },
    { id: 'delete', label: CONTENT_BLOCKS_STRINGS.delete, icon: 'pi pi-trash', severity: 'danger' },
  ];

  protected readonly locales = CONTENT_LOCALES;

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

  protected onAction(event: TableActionEvent<ContentBlock>): void {
    if (event.action === 'edit') {
      this.openForm(event.row);
    } else if (event.action === 'translate') {
      this.openTranslations(event.row);
    } else if (event.action === 'delete') {
      this.confirmDelete(event.row);
    }
  }

  private openForm(block: ContentBlock | null): void {
    const data: ContentBlockDialogData = { block };
    this.dialog
      .open<ContentBlock | undefined>(ContentBlockFormDialog, {
        header: block ? this.strings.editHeader : this.strings.createHeader,
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

  private openTranslations(block: ContentBlock): void {
    const data: ContentBlockTranslationsDialogData = { block };
    this.dialog
      .open<boolean>(ContentBlockTranslationsDialog, {
        header: this.strings.translationsHeader,
        modal: true,
        width: '32rem',
        data,
      })
      .subscribe((changed) => {
        if (changed) {
          this.load(this.lastQuery);
        }
      });
  }

  private confirmDelete(block: ContentBlock): void {
    this.confirmation.confirm({
      header: this.strings.deleteConfirmHeader,
      message: this.strings.deleteConfirmMessage,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { label: this.strings.deleteConfirmYes, severity: 'danger' },
      rejectButtonProps: { label: this.strings.deleteConfirmNo, severity: 'secondary' },
      accept: () => {
        this.api.delete(block.key).subscribe(() => this.load(this.lastQuery));
      },
    });
  }
}
