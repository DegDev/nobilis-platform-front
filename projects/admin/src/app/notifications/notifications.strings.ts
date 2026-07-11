/**
 * User-visible strings for the notifications screen, isolated in one place (same i18n seam
 * rationale as the other admin screens).
 */
export const NOTIFICATIONS_STRINGS = {
  title: 'Notifications',
  back: 'Back to dashboard',

  // tabs
  tabTypes: 'Types',
  tabTemplates: 'Templates',

  // types table
  newType: 'New type',
  columnTypeKey: 'Key',
  columnEnabled: 'Enabled',
  columnDescription: 'Description',
  edit: 'Edit',
  delete: 'Delete',
  enabled: 'Enabled',
  disabled: 'Disabled',

  // type form
  fieldKey: 'Key',
  fieldEnabled: 'Enabled',
  fieldDescription: 'Description',
  keyRequired: 'Key is required',
  createTypeHeader: 'New notification type',
  editTypeHeader: 'Edit notification type',
  save: 'Save',
  cancel: 'Cancel',

  // templates table
  newTemplate: 'New template',
  columnTemplateType: 'Type',
  columnTemplateTransport: 'Transport',
  columnTemplateTranslations: 'Translations',
  translate: 'Translations',

  // template form
  fieldTypeKey: 'Notification type',
  fieldTransport: 'Transport',
  typeKeyRequired: 'Type is required',
  transportRequired: 'Transport is required',
  createTemplateHeader: 'New notification template',
  transportEmail: 'Email',
  transportTelegram: 'Telegram',
  transportSms: 'SMS',

  // translations dialog
  translationsHeader: 'Edit translations',
  fieldSubject: 'Subject',
  fieldBody: 'Body',
  bodyRequired: 'Body is required',
  translationSave: 'Save',
  translationClear: 'Clear',
  close: 'Close',

  // delete confirmations
  deleteTypeConfirmHeader: 'Delete notification type',
  deleteTypeConfirmMessage:
    'Delete this type and all its templates and translations? This cannot be undone.',
  deleteTemplateConfirmHeader: 'Delete notification template',
  deleteTemplateConfirmMessage:
    'Delete this template and all its translations? This cannot be undone.',
  deleteConfirmYes: 'Delete',
  deleteConfirmNo: 'Cancel',
} as const;
