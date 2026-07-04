import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  contentChildren,
  input,
  output,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { PageableQuery, toPageableQuery } from '../../http/pageable/pageable';
import { ColumnCellDirective } from './column-cell.directive';
import { TableAction, TableActionEvent, TableColumn } from './table-column';

/**
 * A generic data table built on PrimeNG's `p-table`, driven by COLUMN CONFIG AS DATA (no metadata
 * engine). By default it paginates and sorts client-side over `value`; set `lazy` and provide
 * `totalRecords`/`loading` to page server-side — then `lazyLoad` emits the PrimeNG event already
 * mapped to Spring {@link PageableQuery} params. Custom cells are plain Angular via the `nbColumnCell`
 * template escape hatch; an optional trailing actions column emits row actions.
 *
 * <p>Ships no strings — every label comes from the caller's config (i18n stays with the consumer).
 * Zoneless/OnPush: state is signals only.
 */
@Component({
  selector: 'nb-generic-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, TableModule, ButtonModule],
  templateUrl: './generic-table.html',
})
export class GenericTable<T = Record<string, unknown>> {
  /** Columns to render, in order. */
  readonly columns = input.required<TableColumn[]>();
  /** Rows for client-side mode; ignored when `lazy` (the parent owns the current page then). */
  readonly value = input<T[]>([]);
  /** Optional row actions rendered in a trailing column. */
  readonly actions = input<TableAction[]>([]);
  readonly paginator = input(true);
  readonly rows = input(10);
  /** Switch to server-side paging: emit `lazyLoad`, render `value` as the current page. */
  readonly lazy = input(false);
  /** Total server-side row count (lazy mode) so the paginator sizes correctly. */
  readonly totalRecords = input<number>();
  readonly loading = input(false);

  /** Emits the requested page/size/sort (lazy mode), mapped to Spring pageable params. */
  readonly lazyLoad = output<PageableQuery>();
  /** Emits the clicked row. */
  readonly rowSelect = output<T>();
  /** Emits a row action (which action id, which row). */
  readonly action = output<TableActionEvent<T>>();

  private readonly cells = contentChildren(ColumnCellDirective);
  private readonly cellByField = computed(() => {
    const byField = new Map<string, TemplateRef<unknown>>();
    for (const cell of this.cells()) {
      byField.set(cell.nbColumnCell(), cell.template);
    }
    return byField;
  });

  protected cellTemplate(field: string): TemplateRef<unknown> | null {
    return this.cellByField().get(field) ?? null;
  }

  protected onLazyLoad(event: TableLazyLoadEvent): void {
    this.lazyLoad.emit(toPageableQuery(event));
  }
}
