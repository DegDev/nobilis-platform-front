import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ColumnCellDirective,
  CrudDialog,
  GenericTable,
  PageableQuery,
  TableActionEvent,
  TableColumn,
  TableAction,
} from 'common';
import { ConfirmationService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogService } from 'primeng/dynamicdialog';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { NotificationTemplate, NotificationType, NOTIFICATION_LOCALES } from './notification';
import { NotificationsApi } from './notifications-api';
import { NOTIFICATIONS_STRINGS } from './notifications.strings';
import {
  NotificationTypeFormDialog,
  NotificationTypeDialogData,
} from './notification-type-form-dialog';
import {
  NotificationTemplateFormDialog,
  NotificationTemplateDialogData,
} from './notification-template-form-dialog';
import {
  NotificationTranslationsDialog,
  NotificationTranslationsDialogData,
} from './notification-translations-dialog';

/**
 * The notifications screen — the first tabbed admin screen. Two tabs: Types (CRUD over
 * {@link NotificationType}) and Templates (CRUD over {@link NotificationTemplate}, with per-locale
 * translation editing). Zoneless/OnPush; all strings from {@link NOTIFICATIONS_STRINGS}.
 */
@Component({
  selector: 'nb-notifications-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ButtonModule,
    TagModule,
    TabsModule,
    ConfirmDialogModule,
    GenericTable,
    ColumnCellDirective,
  ],
  providers: [DialogService, CrudDialog, ConfirmationService],
  templateUrl: './notifications-page.html',
  styleUrl: './notifications-page.scss',
})
export class NotificationsPage {
  private readonly api = inject(NotificationsApi);
  private readonly dialog = inject(CrudDialog);
  private readonly confirmation = inject(ConfirmationService);

  protected readonly strings = NOTIFICATIONS_STRINGS;
  protected readonly locales = NOTIFICATION_LOCALES;

  // ── Types tab state ──
  protected readonly typeRows = signal<NotificationType[]>([]);
  protected readonly typeTotal = signal(0);
  protected readonly typeLoading = signal(false);
  protected readonly typeColumns: TableColumn[] = [
    { field: 'key', header: NOTIFICATIONS_STRINGS.columnTypeKey, sortable: true },
    { field: 'enabled', header: NOTIFICATIONS_STRINGS.columnEnabled },
    { field: 'description', header: NOTIFICATIONS_STRINGS.columnDescription },
  ];
  protected readonly typeActions: TableAction[] = [
    { id: 'edit', label: NOTIFICATIONS_STRINGS.edit, icon: 'pi pi-pencil' },
    { id: 'delete', label: NOTIFICATIONS_STRINGS.delete, icon: 'pi pi-trash', severity: 'danger' },
  ];

  // ── Templates tab state ──
  protected readonly templateRows = signal<NotificationTemplate[]>([]);
  protected readonly templateTotal = signal(0);
  protected readonly templateLoading = signal(false);
  protected readonly templateColumns: TableColumn[] = [
    { field: 'typeKey', header: NOTIFICATIONS_STRINGS.columnTemplateType, sortable: true },
    { field: 'transport', header: NOTIFICATIONS_STRINGS.columnTemplateTransport },
    { field: 'translations', header: NOTIFICATIONS_STRINGS.columnTemplateTranslations },
  ];
  protected readonly templateActions: TableAction[] = [
    { id: 'translate', label: NOTIFICATIONS_STRINGS.translate, icon: 'pi pi-language' },
    { id: 'delete', label: NOTIFICATIONS_STRINGS.delete, icon: 'pi pi-trash', severity: 'danger' },
  ];

  private lastTypeQuery: PageableQuery = { page: 0, size: 10, sort: [] };
  private lastTemplateQuery: PageableQuery = { page: 0, size: 10, sort: [] };

  // ── Types tab ──

  protected loadTypes(query: PageableQuery): void {
    this.lastTypeQuery = query;
    this.typeLoading.set(true);
    this.api.listTypes(query).subscribe({
      next: (page) => {
        this.typeRows.set([...page.content]);
        this.typeTotal.set(page.page.totalElements);
        this.typeLoading.set(false);
      },
      error: () => this.typeLoading.set(false),
    });
  }

  protected createType(): void {
    this.openTypeForm(null);
  }

  protected onTypeAction(event: TableActionEvent<NotificationType>): void {
    if (event.action === 'edit') {
      this.openTypeForm(event.row);
    } else if (event.action === 'delete') {
      this.confirmDeleteType(event.row);
    }
  }

  private openTypeForm(type: NotificationType | null): void {
    const data: NotificationTypeDialogData = { type };
    this.dialog
      .open<NotificationType | undefined>(NotificationTypeFormDialog, {
        header: type ? this.strings.editTypeHeader : this.strings.createTypeHeader,
        modal: true,
        width: '32rem',
        data,
      })
      .subscribe((saved) => {
        if (saved) {
          this.loadTypes(this.lastTypeQuery);
        }
      });
  }

  private confirmDeleteType(type: NotificationType): void {
    this.confirmation.confirm({
      header: this.strings.deleteTypeConfirmHeader,
      message: this.strings.deleteTypeConfirmMessage,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { label: this.strings.deleteConfirmYes, severity: 'danger' },
      rejectButtonProps: { label: this.strings.deleteConfirmNo, severity: 'secondary' },
      accept: () => {
        this.api.deleteType(type.key).subscribe(() => this.loadTypes(this.lastTypeQuery));
      },
    });
  }

  // ── Templates tab ──

  protected loadTemplates(query: PageableQuery): void {
    this.lastTemplateQuery = query;
    this.templateLoading.set(true);
    this.api.listTemplates(query).subscribe({
      next: (page) => {
        this.templateRows.set([...page.content]);
        this.templateTotal.set(page.page.totalElements);
        this.templateLoading.set(false);
      },
      error: () => this.templateLoading.set(false),
    });
  }

  protected createTemplate(): void {
    this.openTemplateForm();
  }

  protected onTemplateAction(event: TableActionEvent<NotificationTemplate>): void {
    if (event.action === 'translate') {
      this.openTranslations(event.row);
    } else if (event.action === 'delete') {
      this.confirmDeleteTemplate(event.row);
    }
  }

  private openTemplateForm(): void {
    const data: NotificationTemplateDialogData = {};
    this.dialog
      .open<NotificationTemplate | undefined>(NotificationTemplateFormDialog, {
        header: this.strings.createTemplateHeader,
        modal: true,
        width: '32rem',
        data,
      })
      .subscribe((saved) => {
        if (saved) {
          this.loadTemplates(this.lastTemplateQuery);
        }
      });
  }

  private openTranslations(template: NotificationTemplate): void {
    const data: NotificationTranslationsDialogData = { template };
    this.dialog
      .open<boolean>(NotificationTranslationsDialog, {
        header: this.strings.translationsHeader,
        modal: true,
        width: '40rem',
        data,
      })
      .subscribe((changed) => {
        if (changed) {
          this.loadTemplates(this.lastTemplateQuery);
        }
      });
  }

  private confirmDeleteTemplate(template: NotificationTemplate): void {
    this.confirmation.confirm({
      header: this.strings.deleteTemplateConfirmHeader,
      message: this.strings.deleteTemplateConfirmMessage,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonProps: { label: this.strings.deleteConfirmYes, severity: 'danger' },
      rejectButtonProps: { label: this.strings.deleteConfirmNo, severity: 'secondary' },
      accept: () => {
        this.api
          .deleteTemplate(template.typeKey, template.transport)
          .subscribe(() => this.loadTemplates(this.lastTemplateQuery));
      },
    });
  }
}
