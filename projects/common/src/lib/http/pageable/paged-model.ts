/**
 * The page metadata object as serialized by Spring Data's {@code PagedModel} in Spring Boot 4
 * (`org.springframework.data.web.PagedModel`): a nested `page` object, not the flat legacy fields.
 * Mirrors exactly what the backend emits (verified against the admin settings integration test).
 */
export interface PageMetadata {
  readonly size: number;
  readonly number: number;
  readonly totalElements: number;
  readonly totalPages: number;
}

/**
 * A page of `T` as returned by a paginated backend endpoint. Matches the `PagedModel` wire shape:
 * `{ content: T[], page: { size, number, totalElements, totalPages } }`.
 */
export interface PagedModel<T> {
  readonly content: readonly T[];
  readonly page: PageMetadata;
}
