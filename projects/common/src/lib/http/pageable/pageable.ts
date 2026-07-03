import { HttpParams } from '@angular/common/http';
import { TableLazyLoadEvent } from 'primeng/table';

/**
 * A Spring `Pageable` request expressed as query params: a zero-based `page`, a `size`, and zero or
 * more `sort` entries in Spring's `field,(asc|desc)` form. This is the request side of {@link
 * PagedModel}; feed it through {@link toHttpParams} to build a GET query.
 */
export interface PageableQuery {
  readonly page: number;
  readonly size: number;
  readonly sort: readonly string[];
}

const DEFAULT_SIZE = 10;

/**
 * Maps a PrimeNG lazy-load event to a {@link PageableQuery}. PrimeNG reports an absolute row offset
 * (`first`) and page size (`rows`); Spring wants a zero-based page index, so `page = first / rows`.
 * Sort is taken from `multiSortMeta` when present, else the single `sortField`/`sortOrder`
 * (`order === -1` → `desc`).
 */
export function toPageableQuery(event: TableLazyLoadEvent): PageableQuery {
  const size = event.rows && event.rows > 0 ? event.rows : DEFAULT_SIZE;
  const first = event.first ?? 0;
  return { page: Math.floor(first / size), size, sort: toSort(event) };
}

function toSort(event: TableLazyLoadEvent): string[] {
  if (event.multiSortMeta?.length) {
    return event.multiSortMeta.map((meta) => `${meta.field},${direction(meta.order)}`);
  }
  if (typeof event.sortField === 'string' && event.sortField.length > 0) {
    return [`${event.sortField},${direction(event.sortOrder)}`];
  }
  return [];
}

function direction(order: number | null | undefined): 'asc' | 'desc' {
  return order === -1 ? 'desc' : 'asc';
}

/**
 * Builds Angular {@link HttpParams} (`page`, `size`, and one `sort` per entry) from a pageable query,
 * ready to pass as a GET request's `params`.
 */
export function toHttpParams(query: PageableQuery): HttpParams {
  let params = new HttpParams().set('page', query.page).set('size', query.size);
  for (const sort of query.sort) {
    params = params.append('sort', sort);
  }
  return params;
}
