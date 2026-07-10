import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ProblemDetailError } from 'common';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { MessageModule } from 'primeng/message';
import { TextareaModule } from 'primeng/textarea';
import { CONTENT_LOCALES, ContentBlock, ContentLocale } from './content-block';
import { ContentBlocksApi } from './content-blocks-api';
import { CONTENT_BLOCKS_STRINGS } from './content-blocks.strings';

/** What the opener passes as `config.data`: the block whose translations are being edited. */
export interface ContentBlockTranslationsDialogData {
  readonly block: ContentBlock;
}

interface LocaleState {
  readonly body: string;
  readonly pending: boolean;
  readonly error: string | null;
}

/**
 * Bespoke translations editor for one content block's `ru`/`ro` bodies — the nested per-locale shape
 * doesn't fit {@link GenericForm}'s flat field list, so this is plain signals + direct
 * {@link ContentBlocksApi} calls per locale (upsert/remove), not the generic form. Each locale saves
 * independently; the dialog closes with whether anything changed so the opener knows to reload.
 */
@Component({
  selector: 'nb-content-block-translations-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, TextareaModule, MessageModule],
  templateUrl: './content-block-translations-dialog.html',
  styleUrl: './content-block-translations-dialog.scss',
})
export class ContentBlockTranslationsDialog {
  private readonly api = inject(ContentBlocksApi);
  private readonly ref = inject(DynamicDialogRef);
  private readonly config =
    inject<DynamicDialogConfig<ContentBlockTranslationsDialogData>>(DynamicDialogConfig);

  protected readonly strings = CONTENT_BLOCKS_STRINGS;
  protected readonly locales = CONTENT_LOCALES;

  private readonly key = this.config.data!.block.key;
  private readonly translations = this.config.data!.block.translations;

  protected readonly state = signal<Record<ContentLocale, LocaleState>>(
    Object.fromEntries(
      CONTENT_LOCALES.map((locale) => [
        locale,
        { body: this.translations[locale] ?? '', pending: false, error: null },
      ]),
    ) as Record<ContentLocale, LocaleState>,
  );

  private changed = false;

  protected setBody(locale: ContentLocale, body: string): void {
    this.state.update((current) => ({ ...current, [locale]: { ...current[locale], body } }));
  }

  protected save(locale: ContentLocale): void {
    const body = this.state()[locale].body;
    this.patch(locale, { pending: true, error: null });
    this.api.upsertTranslation(this.key, locale, { body }).subscribe({
      next: () => {
        this.changed = true;
        this.patch(locale, { pending: false });
      },
      error: (error: unknown) => this.patch(locale, { pending: false, error: this.message(error) }),
    });
  }

  protected clear(locale: ContentLocale): void {
    this.patch(locale, { pending: true, error: null });
    this.api.removeTranslation(this.key, locale).subscribe({
      next: () => {
        this.changed = true;
        this.state.update((current) => ({
          ...current,
          [locale]: { body: '', pending: false, error: null },
        }));
      },
      error: (error: unknown) => this.patch(locale, { pending: false, error: this.message(error) }),
    });
  }

  protected close(): void {
    this.ref.close(this.changed);
  }

  private patch(locale: ContentLocale, partial: Partial<LocaleState>): void {
    this.state.update((current) => ({ ...current, [locale]: { ...current[locale], ...partial } }));
  }

  private message(error: unknown): string {
    return error instanceof ProblemDetailError
      ? (error.problem.detail ?? error.message)
      : String(error);
  }
}
