import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { PageableQuery, PagedModel, toHttpParams } from 'common';
import { Observable } from 'rxjs';
import {
  NotificationLocale,
  NotificationTemplate,
  NotificationTemplateCreateRequest,
  NotificationTemplateTranslationRequest,
  NotificationType,
  NotificationTypeCreateRequest,
  NotificationTypeUpdateRequest,
  Transport,
} from './notification';

/**
 * Talks to the admin notifications REST API — thin `HttpClient` wrapper, same shape as
 * `ContentBlocksApi`. Types under `/api/admin/notification-types`, templates under
 * `/api/admin/notification-templates`.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsApi {
  private static readonly TYPES = '/api/admin/notification-types';
  private static readonly TEMPLATES = '/api/admin/notification-templates';

  private readonly http = inject(HttpClient);

  // ── Types ──

  listTypes(query: PageableQuery): Observable<PagedModel<NotificationType>> {
    return this.http.get<PagedModel<NotificationType>>(NotificationsApi.TYPES, {
      params: toHttpParams(query),
    });
  }

  createType(request: NotificationTypeCreateRequest): Observable<NotificationType> {
    return this.http.post<NotificationType>(NotificationsApi.TYPES, request);
  }

  updateType(key: string, request: NotificationTypeUpdateRequest): Observable<NotificationType> {
    return this.http.put<NotificationType>(
      `${NotificationsApi.TYPES}/${encodeURIComponent(key)}`,
      request,
    );
  }

  deleteType(key: string): Observable<void> {
    return this.http.delete<void>(`${NotificationsApi.TYPES}/${encodeURIComponent(key)}`);
  }

  // ── Templates ──

  listTemplates(
    query: PageableQuery,
    typeKey?: string,
  ): Observable<PagedModel<NotificationTemplate>> {
    let params = toHttpParams(query);
    if (typeKey) {
      params = params.set('typeKey', typeKey);
    }
    return this.http.get<PagedModel<NotificationTemplate>>(NotificationsApi.TEMPLATES, { params });
  }

  createTemplate(request: NotificationTemplateCreateRequest): Observable<NotificationTemplate> {
    return this.http.post<NotificationTemplate>(NotificationsApi.TEMPLATES, request);
  }

  deleteTemplate(typeKey: string, transport: Transport): Observable<void> {
    return this.http.delete<void>(
      `${NotificationsApi.TEMPLATES}/${encodeURIComponent(typeKey)}/${transport}`,
    );
  }

  upsertTemplateTranslation(
    typeKey: string,
    transport: Transport,
    locale: NotificationLocale,
    request: NotificationTemplateTranslationRequest,
  ): Observable<NotificationTemplate> {
    return this.http.put<NotificationTemplate>(
      `${NotificationsApi.TEMPLATES}/${encodeURIComponent(typeKey)}/${transport}/translations/${locale}`,
      request,
    );
  }

  removeTemplateTranslation(
    typeKey: string,
    transport: Transport,
    locale: NotificationLocale,
  ): Observable<void> {
    return this.http.delete<void>(
      `${NotificationsApi.TEMPLATES}/${encodeURIComponent(typeKey)}/${transport}/translations/${locale}`,
    );
  }
}
