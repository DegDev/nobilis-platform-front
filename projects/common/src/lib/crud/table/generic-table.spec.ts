import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PageableQuery } from '../../http/pageable/pageable';
import { ColumnCellDirective } from './column-cell.directive';
import { GenericTable } from './generic-table';
import { TableColumn } from './table-column';

interface Row {
  key: string;
  secret: boolean;
}

@Component({
  imports: [GenericTable, ColumnCellDirective],
  template: `
    <nb-generic-table
      [columns]="columns"
      [value]="rows()"
      [lazy]="lazy()"
      [totalRecords]="100"
      (lazyLoad)="captured = $event"
    >
      <ng-template nbColumnCell="secret" let-row>
        <span class="custom-cell">{{ row.secret ? 'yes' : 'no' }}</span>
      </ng-template>
    </nb-generic-table>
  `,
})
class TableHost {
  readonly columns: TableColumn[] = [
    { field: 'key', header: 'Key', sortable: true },
    { field: 'secret', header: 'Secret' },
  ];
  readonly rows = signal<Row[]>([{ key: 'portal.title', secret: false }]);
  readonly lazy = signal(false);
  captured?: PageableQuery;
}

describe('GenericTable', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TableHost] }).compileComponents();
  });

  it('renders headers from the column config, a default cell, and a custom-cell template', () => {
    const fixture = TestBed.createComponent(TableHost);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const headers = Array.from(el.querySelectorAll('th')).map((th) => th.textContent?.trim());
    expect(headers.some((h) => h?.includes('Key'))).toBe(true);
    expect(headers.some((h) => h?.includes('Secret'))).toBe(true);

    // Default cell renders row[field]; the `secret` column is a projected custom cell.
    expect(el.textContent).toContain('portal.title');
    expect(el.querySelector('.custom-cell')?.textContent).toContain('no');
  });

  it('emits a mapped pageable query on the initial lazy load', async () => {
    const fixture = TestBed.createComponent(TableHost);
    fixture.componentInstance.lazy.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.captured).toBeDefined();
    expect(fixture.componentInstance.captured?.page).toBe(0);
    expect(fixture.componentInstance.captured?.size).toBe(10);
  });
});
