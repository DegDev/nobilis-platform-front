import { TableLazyLoadEvent } from 'primeng/table';
import { toHttpParams, toPageableQuery } from './pageable';

describe('toPageableQuery', () => {
  it('maps PrimeNG first/rows to a zero-based page and size', () => {
    const query = toPageableQuery({ first: 20, rows: 10 } as TableLazyLoadEvent);

    expect(query.page).toBe(2);
    expect(query.size).toBe(10);
  });

  it('maps a single sort field to Spring `field,dir` (order -1 = desc)', () => {
    const query = toPageableQuery({
      first: 0,
      rows: 10,
      sortField: 'key',
      sortOrder: -1,
    } as TableLazyLoadEvent);

    expect(query.sort).toEqual(['key,desc']);
  });

  it('maps multiSortMeta in order', () => {
    const query = toPageableQuery({
      first: 0,
      rows: 5,
      multiSortMeta: [
        { field: 'a', order: 1 },
        { field: 'b', order: -1 },
      ],
    } as TableLazyLoadEvent);

    expect(query.sort).toEqual(['a,asc', 'b,desc']);
  });

  it('defaults size and empties sort when the event omits them', () => {
    const query = toPageableQuery({ first: 0 } as TableLazyLoadEvent);

    expect(query.size).toBe(10);
    expect(query.sort).toEqual([]);
  });
});

describe('toHttpParams', () => {
  it('sets page/size and appends one sort param per entry', () => {
    const params = toHttpParams({ page: 1, size: 20, sort: ['key,asc', 'value,desc'] });

    expect(params.get('page')).toBe('1');
    expect(params.get('size')).toBe('20');
    expect(params.getAll('sort')).toEqual(['key,asc', 'value,desc']);
  });
});
