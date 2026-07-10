/** Draft/publish lifecycle of a content block — mirrors the backend `ContentStatus` enum. */
export type ContentBlockStatus = 'DRAFT' | 'PUBLISHED';

/** The only locales the engine's `LocaleResolver` supports today. */
export const CONTENT_LOCALES = ['ru', 'ro'] as const;
export type ContentLocale = (typeof CONTENT_LOCALES)[number];

/**
 * The admin API view of a content block — mirrors the backend `ContentBlockDto`. `translations` is
 * a flat map keyed by locale code (not an array), matching the wire format exactly.
 */
export interface ContentBlock {
  readonly key: string;
  readonly status: ContentBlockStatus;
  readonly translations: Readonly<Record<string, string>>;
}

/** Body for `POST /admin/api/content-blocks` — mirrors the backend `ContentBlockCreateRequest`. */
export interface ContentBlockCreateRequest {
  readonly key: string;
  readonly status: ContentBlockStatus;
}

/**
 * Body for `PUT /admin/api/content-blocks/{key}/status` — mirrors the backend
 * `ContentBlockStatusUpdateRequest`.
 */
export interface ContentBlockStatusUpdateRequest {
  readonly status: ContentBlockStatus;
}

/**
 * Body for `PUT /admin/api/content-blocks/{key}/translations/{locale}` — mirrors the backend
 * `ContentBlockTranslationRequest`.
 */
export interface ContentBlockTranslationRequest {
  readonly body: string;
}
