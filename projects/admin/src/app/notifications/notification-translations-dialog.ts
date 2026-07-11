import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ProblemDetailError } from 'common';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
import { NotificationLocale, NotificationTemplate, NOTIFICATION_LOCALES } from './notification';
import { NotificationsApi } from './notifications-api';
import { NOTIFICATIONS_STRINGS } from './notifications.strings';

export interface NotificationTranslationsDialogData {
  readonly template: NotificationTemplate;
}

interface LocaleState {
  readonly subject: string;
  readonly body: string;
  readonly pending: boolean;
  readonly error: string | null;
}

/**
 * Edits the per-locale subject+body translations for a template — same bespoke shape as {@link
 * ../cms/content-block-translations-dialog!ContentBlockTranslationsDialog}: plain signals + direct
 * {@link NotificationsApi} calls per locale (upsert/remove), not Reactive Forms. Each locale saves
 * independently; the dialog closes with whether anything changed so the opener knows to reload.
 */
@Component({
  selector: 'nb-notification-translations-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, InputTextModule, TextareaModule, MessageModule],
  templateUrl: './notification-translations-dialog.html',
  styleUrl: './notification-translations-dialog.scss',
})
export class NotificationTranslationsDialog {
  private readonly api = inject(NotificationsApi);
  private readonly ref = inject(DynamicDialogRef<boolean>);
  private readonly config = inject(DynamicDialogConfig<NotificationTranslationsDialogData>);

  protected readonly strings = NOTIFICATIONS_STRINGS;
  protected readonly locales = NOTIFICATION_LOCALES;

  private readonly typeKey = this.config.data!.template.typeKey;
  private readonly transport = this.config.data!.template.transport;
  private readonly translations = this.config.data!.template.translations;

  protected readonly state = signal<Record<NotificationLocale, LocaleState>>(
    Object.fromEntries(
      NOTIFICATION_LOCALES.map((locale) => [
        locale,
        {
          subject: this.translations[locale]?.subject ?? '',
          body: this.translations[locale]?.body ?? '',
          pending: false,
          error: null,
        },
      ]),
    ) as Record<NotificationLocale, LocaleState>,
  );

  private changed = false;

  protected setSubject(locale: NotificationLocale, subject: string): void {
    this.state.update((current) => ({ ...current, [locale]: { ...current[locale], subject } }));
  }

  protected setBody(locale: NotificationLocale, body: string): void {
    this.state.update((current) => ({ ...current, [locale]: { ...current[locale], body } }));
  }

  protected save(locale: NotificationLocale): void {
    const { subject, body } = this.state()[locale];
    if (!body) return;
    this.patch(locale, { pending: true, error: null });
    this.api
      .upsertTemplateTranslation(this.typeKey, this.transport, locale, {
        subject: subject ? subject : null,
        body,
      })
      .subscribe({
        next: () => {
          this.changed = true;
          this.patch(locale, { pending: false });
        },
        error: (error: unknown) =>
          this.patch(locale, { pending: false, error: this.message(error) }),
      });
  }

  protected clear(locale: NotificationLocale): void {
    this.patch(locale, { pending: true, error: null });
    this.api.removeTemplateTranslation(this.typeKey, this.transport, locale).subscribe({
      next: () => {
        this.changed = true;
        this.state.update((current) => ({
          ...current,
          [locale]: { subject: '', body: '', pending: false, error: null },
        }));
      },
      error: (error: unknown) => this.patch(locale, { pending: false, error: this.message(error) }),
    });
  }

  protected close(): void {
    this.ref.close(this.changed);
  }

  private patch(locale: NotificationLocale, partial: Partial<LocaleState>): void {
    this.state.update((current) => ({ ...current, [locale]: { ...current[locale], ...partial } }));
  }

  private message(error: unknown): string {
    return error instanceof ProblemDetailError
      ? (error.problem.detail ?? error.message)
      : String(error);
  }
}
