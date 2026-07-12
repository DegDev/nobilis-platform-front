/**
 * User-visible strings for the content-blocks screen, isolated in one place (same i18n seam
 * rationale as settings/roles/accounts — no hardcoded display strings in the templates).
 */
export const CONTENT_BLOCKS_STRINGS = {
  title: $localize`:@@ContentBlocks:Content blocks`,
  back: $localize`:@@BackToDashboard:Back to dashboard`,
  newBlock: $localize`:@@NewContentBlock:New content block`,

  // table columns + cells
  columnKey: $localize`:@@Key:Key`,
  columnStatus: $localize`:@@Status:Status`,
  columnTranslations: $localize`:@@Translations:Translations`,
  edit: $localize`:@@Edit:Edit`,
  translate: $localize`:@@Translations:Translations`,
  delete: $localize`:@@Delete:Delete`,

  // form fields
  fieldKey: $localize`:@@Key:Key`,
  fieldStatus: $localize`:@@Status:Status`,
  keyRequired: $localize`:@@KeyRequired:Key is required`,
  statusDraft: $localize`:@@StatusDraft:Draft`,
  statusPublished: $localize`:@@StatusPublished:Published`,

  // dialog
  createHeader: $localize`:@@NewContentBlock:New content block`,
  editHeader: $localize`:@@EditContentBlockHeader:Edit content block`,
  save: $localize`:@@Save:Save`,
  cancel: $localize`:@@Cancel:Cancel`,

  // translations dialog
  translationsHeader: $localize`:@@EditTranslationsHeader:Edit translations`,
  translationEmpty: $localize`:@@NoTranslationYet:No translation yet.`,
  translationSave: $localize`:@@Save:Save`,
  translationClear: $localize`:@@Clear:Clear`,
  close: $localize`:@@Close:Close`,

  // delete confirmation
  deleteConfirmHeader: $localize`:@@DeleteContentBlockHeader:Delete content block`,
  deleteConfirmMessage: $localize`:@@DeleteContentBlockConfirmMessage:Delete this content block and all its translations? This cannot be undone.`,
  deleteConfirmYes: $localize`:@@Delete:Delete`,
  deleteConfirmNo: $localize`:@@Cancel:Cancel`,
} as const;
