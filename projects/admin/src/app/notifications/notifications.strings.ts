/**
 * User-visible strings for the notifications screen, isolated in one place (same i18n seam
 * rationale as the other admin screens).
 */
export const NOTIFICATIONS_STRINGS = {
  title: $localize`:@@Notifications:Notifications`,
  back: $localize`:@@BackToDashboard:Back to dashboard`,

  // tabs
  tabTypes: $localize`:@@TabTypes:Types`,
  tabTemplates: $localize`:@@TabTemplates:Templates`,

  // types table
  newType: $localize`:@@NewType:New type`,
  columnTypeKey: $localize`:@@Key:Key`,
  columnEnabled: $localize`:@@Enabled:Enabled`,
  columnDescription: $localize`:@@Description:Description`,
  edit: $localize`:@@Edit:Edit`,
  delete: $localize`:@@Delete:Delete`,
  enabled: $localize`:@@Enabled:Enabled`,
  disabled: $localize`:@@Disabled:Disabled`,

  // type form
  fieldKey: $localize`:@@Key:Key`,
  fieldEnabled: $localize`:@@Enabled:Enabled`,
  fieldDescription: $localize`:@@Description:Description`,
  keyRequired: $localize`:@@KeyRequired:Key is required`,
  createTypeHeader: $localize`:@@NewNotificationTypeHeader:New notification type`,
  editTypeHeader: $localize`:@@EditNotificationTypeHeader:Edit notification type`,
  save: $localize`:@@Save:Save`,
  cancel: $localize`:@@Cancel:Cancel`,

  // templates table
  newTemplate: $localize`:@@NewTemplate:New template`,
  columnTemplateType: $localize`:@@Type:Type`,
  columnTemplateTransport: $localize`:@@Transport:Transport`,
  columnTemplateTranslations: $localize`:@@Translations:Translations`,
  translate: $localize`:@@Translations:Translations`,

  // template form
  fieldTypeKey: $localize`:@@NotificationTypeLabel:Notification type`,
  fieldTransport: $localize`:@@Transport:Transport`,
  typeKeyRequired: $localize`:@@TypeRequired:Type is required`,
  transportRequired: $localize`:@@TransportRequired:Transport is required`,
  createTemplateHeader: $localize`:@@NewNotificationTemplateHeader:New notification template`,
  transportEmail: $localize`:@@Email:Email`,
  transportTelegram: $localize`:@@Telegram:Telegram`,
  transportSms: $localize`:@@Sms:SMS`,

  // translations dialog
  translationsHeader: $localize`:@@EditTranslationsHeader:Edit translations`,
  fieldSubject: $localize`:@@Subject:Subject`,
  fieldBody: $localize`:@@Body:Body`,
  bodyRequired: $localize`:@@BodyRequired:Body is required`,
  translationSave: $localize`:@@Save:Save`,
  translationClear: $localize`:@@Clear:Clear`,
  close: $localize`:@@Close:Close`,

  // delete confirmations
  deleteTypeConfirmHeader: $localize`:@@DeleteNotificationTypeHeader:Delete notification type`,
  deleteTypeConfirmMessage: $localize`:@@DeleteNotificationTypeConfirmMessage:Delete this type and all its templates and translations? This cannot be undone.`,
  deleteTemplateConfirmHeader: $localize`:@@DeleteNotificationTemplateHeader:Delete notification template`,
  deleteTemplateConfirmMessage: $localize`:@@DeleteNotificationTemplateConfirmMessage:Delete this template and all its translations? This cannot be undone.`,
  deleteConfirmYes: $localize`:@@Delete:Delete`,
  deleteConfirmNo: $localize`:@@Cancel:Cancel`,
} as const;
