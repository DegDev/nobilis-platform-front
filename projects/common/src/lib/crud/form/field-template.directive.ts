import { Directive, TemplateRef, inject, input } from '@angular/core';

/**
 * Escape hatch for a custom form field (composition over configuration). Mark a template with the
 * field key and {@link GenericForm} renders it in place of the built-in input:
 *
 * ```html
 * <ng-template nbFieldTemplate="role" let-field>
 *   <my-role-picker [(value)]="field.value" />
 * </ng-template>
 * ```
 *
 * The field state is the implicit context; its index is available as `index`.
 */
@Directive({ selector: '[nbFieldTemplate]' })
export class FieldTemplateDirective {
  /** The field `key` this template renders. */
  readonly nbFieldTemplate = input.required<string>();

  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}
