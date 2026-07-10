/**
 * User-visible strings for the content-blocks screen, isolated in one place (same i18n seam
 * rationale as settings/roles/accounts — no hardcoded display strings in the templates).
 */
export const CONTENT_BLOCKS_STRINGS = {
  title: 'Content blocks',
  back: 'Back to dashboard',
  newBlock: 'New content block',

  // table columns + cells
  columnKey: 'Key',
  columnStatus: 'Status',
  columnTranslations: 'Translations',
  edit: 'Edit',
  translate: 'Translations',
  delete: 'Delete',

  // form fields
  fieldKey: 'Key',
  fieldStatus: 'Status',
  keyRequired: 'Key is required',
  statusDraft: 'Draft',
  statusPublished: 'Published',

  // dialog
  createHeader: 'New content block',
  editHeader: 'Edit content block',
  save: 'Save',
  cancel: 'Cancel',

  // translations dialog
  translationsHeader: 'Edit translations',
  translationEmpty: 'No translation yet.',
  translationSave: 'Save',
  translationClear: 'Clear',
  close: 'Close',

  // delete confirmation
  deleteConfirmHeader: 'Delete content block',
  deleteConfirmMessage:
    'Delete this content block and all its translations? This cannot be undone.',
  deleteConfirmYes: 'Delete',
  deleteConfirmNo: 'Cancel',
} as const;
