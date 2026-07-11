/** Transport channels — mirrors the backend `Transport` enum. */
export type Transport = 'EMAIL' | 'TELEGRAM' | 'SMS';

/** The only locales the engine's `LocaleResolver` supports today. */
export const NOTIFICATION_LOCALES = ['ru', 'ro'] as const;
export type NotificationLocale = (typeof NOTIFICATION_LOCALES)[number];

/** The admin API view of a notification type — mirrors backend `NotificationTypeDto`. */
export interface NotificationType {
  readonly key: string;
  readonly enabled: boolean;
  readonly description: string | null;
}

/** Body for `POST /admin/api/notification-types`. */
export interface NotificationTypeCreateRequest {
  readonly key: string;
  readonly enabled: boolean;
  readonly description: string | null;
}

/** Body for `PUT /admin/api/notification-types/{key}`. */
export interface NotificationTypeUpdateRequest {
  readonly enabled: boolean;
  readonly description: string | null;
}

/** A single locale's subject + body for a template translation. */
export interface NotificationTranslation {
  readonly subject: string | null;
  readonly body: string;
}

/** The admin API view of a notification template — mirrors backend `NotificationTemplateDto`. */
export interface NotificationTemplate {
  readonly typeKey: string;
  readonly transport: Transport;
  readonly translations: Readonly<Record<string, NotificationTranslation>>;
}

/** Body for `POST /admin/api/notification-templates`. */
export interface NotificationTemplateCreateRequest {
  readonly typeKey: string;
  readonly transport: Transport;
}

/** Body for `PUT .../translations/{locale}`. */
export interface NotificationTemplateTranslationRequest {
  readonly subject: string | null;
  readonly body: string;
}
