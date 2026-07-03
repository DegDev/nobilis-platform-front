import {
  CrudDialog,
  GenericForm,
  GenericTable,
  parseProblemDetail,
  toPageableQuery,
  type PagedModel,
} from 'common';

/**
 * Smoke test: the admin app can import the generic CRUD surface from the `common` library. This only
 * proves the public API resolves and type-checks from a consumer — real consumption (the settings
 * screen) lands in milestone-03 pass 3c.
 */
describe('common library smoke import (from admin app)', () => {
  it('re-exports the generic CRUD surface', () => {
    expect(GenericTable).toBeTruthy();
    expect(GenericForm).toBeTruthy();
    expect(CrudDialog).toBeTruthy();
    expect(typeof toPageableQuery).toBe('function');
    expect(typeof parseProblemDetail).toBe('function');

    const page: PagedModel<string> = {
      content: [],
      page: { size: 10, number: 0, totalElements: 0, totalPages: 0 },
    };
    expect(page.content.length).toBe(0);
  });
});
