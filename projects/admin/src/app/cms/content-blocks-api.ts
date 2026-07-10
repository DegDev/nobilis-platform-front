import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { PageableQuery, PagedModel, toHttpParams } from 'common';
import { Observable } from 'rxjs';
import {
  ContentBlock,
  ContentBlockCreateRequest,
  ContentBlockStatusUpdateRequest,
  ContentBlockTranslationRequest,
  ContentLocale,
} from './content-block';

/**
 * Talks to the admin content-blocks REST API (`/admin/api/content-blocks`) — the same thin
 * `HttpClient` wrapper shape as `SettingsApi`: `PagedModel` list responses, `PageableQuery` request
 * params, errors surfaced as the common `ProblemDetailError` via the global problem interceptor.
 */
@Injectable({ providedIn: 'root' })
export class ContentBlocksApi {
  private static readonly BASE = '/admin/api/content-blocks';

  private readonly http = inject(HttpClient);

  /** Lists content blocks, one page at a time. */
  list(query: PageableQuery): Observable<PagedModel<ContentBlock>> {
    return this.http.get<PagedModel<ContentBlock>>(ContentBlocksApi.BASE, {
      params: toHttpParams(query),
    });
  }

  /** Creates a content block with an empty translation set. */
  create(request: ContentBlockCreateRequest): Observable<ContentBlock> {
    return this.http.post<ContentBlock>(ContentBlocksApi.BASE, request);
  }

  /** Moves the block between `DRAFT` and `PUBLISHED`. */
  updateStatus(key: string, request: ContentBlockStatusUpdateRequest): Observable<ContentBlock> {
    return this.http.put<ContentBlock>(
      `${ContentBlocksApi.BASE}/${encodeURIComponent(key)}/status`,
      request,
    );
  }

  /** Upserts the translation body at `locale`; returns the whole block (all translations). */
  upsertTranslation(
    key: string,
    locale: ContentLocale,
    request: ContentBlockTranslationRequest,
  ): Observable<ContentBlock> {
    return this.http.put<ContentBlock>(
      `${ContentBlocksApi.BASE}/${encodeURIComponent(key)}/translations/${locale}`,
      request,
    );
  }

  /** Removes the translation at `locale`. */
  removeTranslation(key: string, locale: ContentLocale): Observable<void> {
    return this.http.delete<void>(
      `${ContentBlocksApi.BASE}/${encodeURIComponent(key)}/translations/${locale}`,
    );
  }

  /** Deletes the content block at `key`. */
  delete(key: string): Observable<void> {
    return this.http.delete<void>(`${ContentBlocksApi.BASE}/${encodeURIComponent(key)}`);
  }
}
