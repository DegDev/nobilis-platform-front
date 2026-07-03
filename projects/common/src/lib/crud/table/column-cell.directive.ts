import { Directive, TemplateRef, inject, input } from '@angular/core';

/**
 * Escape hatch for a custom table cell (composition over configuration). Mark a template with the
 * column's field key and {@link GenericTable} renders it in place of the default `{{ row[field] }}`:
 *
 * ```html
 * <ng-template nbColumnCell="secret" let-row>
 *   <i class="pi" [class.pi-lock]="row.secret"></i>
 * </ng-template>
 * ```
 *
 * The row is the implicit context; the column config is available as `column`.
 */
@Directive({ selector: '[nbColumnCell]' })
export class ColumnCellDirective {
  /** The column `field` this template renders. */
  readonly nbColumnCell = input.required<string>();

  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}
